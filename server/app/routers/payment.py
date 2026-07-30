import os
import hashlib
import random
import time
from fastapi import APIRouter, Depends, HTTPException, status, Form, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from .. import database, models, schemas, auth
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/payment",
    tags=["payment"]
)

# ── PayU Gateway Configuration ─────────────────────────────────────────────
# Read from environment — NO hardcoded fallback keys for security
PAYU_ENV_RAW = os.getenv("PAYU_ENV", "test")
PAYU_KEY = os.getenv("PAYU_KEY", "")
PAYU_SALT = os.getenv("PAYU_SALT", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Normalize env to a canonical lowercase form for comparison
# Accepts: PROD, prod, production, Production → maps to "production"
# Accepts: TEST, test, sandbox, SANDBOX   → maps to "test"
_env_normalized = PAYU_ENV_RAW.strip().lower()
IS_PRODUCTION = _env_normalized in ("prod", "production")

PAYU_GATEWAY_URL = (
    "https://secure.payu.in/_payment"
    if IS_PRODUCTION
    else "https://test.payu.in/_payment"
)

print(f"[PayU] Environment: {'PRODUCTION ✅' if IS_PRODUCTION else 'SANDBOX/TEST ⚠️'}")
print(f"[PayU] Gateway URL: {PAYU_GATEWAY_URL}")

class PaymentInitiateRequest(BaseModel):
    plan_id: str
    currency: str

# ── Plan → Subscription duration mapping (in days) ────────────────────────
PLAN_DURATION_DAYS = {
    "starter": 30,
    "professional": 30,
    "enterprise": 365,
}

@router.post("/initiate")
def initiate_payment(
    payload: PaymentInitiateRequest,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Guard: keys must be configured
    if not PAYU_KEY or not PAYU_SALT:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment gateway is not configured. Please contact support."
        )

    plan_id = payload.plan_id.lower()
    currency = payload.currency.upper()
    
    # Secure price mapping from backend only — prevents frontend price tampering
    prices = {
        "starter":      {"INR": "799.00",  "USD": "9.99"},
        "professional": {"INR": "1999.00", "USD": "24.99"},
        "enterprise":   {"INR": "7999.00", "USD": "99.99"}
    }
    
    if plan_id not in prices or currency not in ["INR", "USD"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan_id or currency selection"
        )
        
    amount = prices[plan_id][currency]
    # Use a unique txnid with timestamp + random suffix (max 25 chars for PayU)
    txnid = f"SG{int(time.time())}{random.randint(100, 999)}"
    productinfo = f"SenseGrid {plan_id.capitalize()} Plan"
    
    # PayU requires firstname to be non-empty and contain only letters/spaces
    raw_name = (current_user.full_name or "User").strip()
    firstname = raw_name if raw_name else "User"
    
    email = current_user.email
    
    # PayU requires a 10-digit phone; strip non-digits and pad/trim if needed
    raw_phone = (current_user.phone_number or "").strip()
    phone_digits = "".join(filter(str.isdigit, raw_phone))
    phone = phone_digits[-10:] if len(phone_digits) >= 10 else "9999999999"
    
    # Use FRONTEND_URL as the canonical origin for all redirect URLs
    # (PayU callback is always backend → backend, never from origin header)
    origin = FRONTEND_URL.rstrip("/")
    
    # PayU Secure Hash Formula:
    # sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    udf1 = plan_id    # used to upgrade subscription on callback
    udf2 = currency   # to set subscription_currency
    udf3 = origin     # frontend redirect base URL
    
    hash_sequence = f"{PAYU_KEY}|{txnid}|{amount}|{productinfo}|{firstname}|{email}|{udf1}|{udf2}|{udf3}||||||||{PAYU_SALT}"
    tx_hash = hashlib.sha512(hash_sequence.encode('utf-8')).hexdigest().lower()
    
    # surl/furl both point to our backend callback; we redirect to frontend from there
    callback_url = f"{BACKEND_URL}/api/v1/payment/callback"
    
    print(f"[PayU] Initiating {'PROD' if IS_PRODUCTION else 'TEST'} payment: txnid={txnid}, plan={plan_id}, amount={amount} {currency}, user={email}")
    
    return {
        "payu_url":   PAYU_GATEWAY_URL,
        "key":        PAYU_KEY,
        "txnid":      txnid,
        "amount":     amount,
        "productinfo":productinfo,
        "firstname":  firstname,
        "email":      email,
        "phone":      phone,
        "surl":       callback_url,
        "furl":       callback_url,
        "hash":       tx_hash,
        "udf1":       udf1,
        "udf2":       udf2,
        "udf3":       udf3
    }


@router.post("/callback")
def payment_callback(
    request: Request,
    background_tasks: BackgroundTasks,
    status: str = Form(...),
    txnid: str = Form(...),
    amount: str = Form(...),
    productinfo: str = Form(...),
    firstname: str = Form(...),
    email: str = Form(...),
    key: str = Form(...),
    hash: str = Form(...),
    udf1: str = Form(...), # plan_id
    udf2: str = Form(...), # currency
    udf3: str = Form(...), # origin (frontend URL)
    db: Session = Depends(database.get_db)
):
    # PayU Reverse Hash Formula (to verify authenticity):
    # sha512(SALT|status||||||||udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    # udf3 is origin, udf2 is currency, udf1 is plan_id
    reverse_hash_sequence = f"{PAYU_SALT}|{status}||||||||{udf3}|{udf2}|{udf1}|{email}|{firstname}|{productinfo}|{amount}|{txnid}|{key}"
    computed_hash = hashlib.sha512(reverse_hash_sequence.encode('utf-8')).hexdigest().lower()
    
    if computed_hash != hash.lower():
        print(f"FRAUD ALERT: Hash mismatch detected on callback for txn: {txnid}")
        return RedirectResponse(
            url=f"{udf3}/payment/failure?txnid={txnid}&reason=hash_mismatch",
            status_code=303
        )
        
    if status.lower() == "success":
        from datetime import datetime, timezone, timedelta
        from ..utils import email as email_utils
        
        # Find user and upgrade their subscription plan
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            plan_name = udf1.lower()
            duration_days = PLAN_DURATION_DAYS.get(plan_name, 30)
            expiry_dt = datetime.now(timezone.utc) + timedelta(days=duration_days)
            
            user.subscription_plan = plan_name
            user.subscription_status = "active"
            user.subscription_currency = udf2.upper()
            user.subscription_expiry = expiry_dt
            db.commit()
            db.refresh(user)
            
            print(f"[PayU] ✅ SUCCESS: Upgraded {email} → {plan_name} | Expires: {expiry_dt.date()} | TXN: {txnid}")
            
            # Send Brevo HTML Email confirmation in background
            background_tasks.add_task(
                email_utils.send_subscription_success_email,
                user_email=email,
                full_name=user.full_name or "IoT Administrator",
                plan_name=plan_name,
                amount=amount,
                currency=udf2.upper(),
                txnid=txnid
            )
        else:
            print(f"[PayU] ⚠️ SUCCESS callback but user not found for email: {email}")
            
        return RedirectResponse(
            url=f"{udf3}/payment/success?plan={udf1}&txnid={txnid}&amount={amount}&currency={udf2}",
            status_code=303
        )
    else:
        print(f"[PayU] ❌ FAILED: {email} | TXN: {txnid} | Status: {status}")
        return RedirectResponse(
            url=f"{udf3}/payment/failure?txnid={txnid}&plan={udf1}&amount={amount}&currency={udf2}&reason={status}",
            status_code=303
        )
