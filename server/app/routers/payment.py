import os
import hashlib
import random
import time
from fastapi import APIRouter, Depends, HTTPException, status, Form, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from .. import database, models, schemas, auth
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/payment",
    tags=["payment"]
)

# Fetch settings from environment or default to Sandbox credentials
PAYU_ENV = os.getenv("PAYU_ENV", "test").lower()
PAYU_KEY = os.getenv("PAYU_KEY", "gtKFFx")
PAYU_SALT = os.getenv("PAYU_SALT", "eCwWELSp")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Redirect URL based on the environment setting
PAYU_GATEWAY_URL = "https://secure.payu.in/_payment" if PAYU_ENV == "production" else "https://test.payu.in/_payment"

class PaymentInitiateRequest(BaseModel):
    plan_id: str
    currency: str

@router.post("/initiate")
def initiate_payment(
    payload: PaymentInitiateRequest,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    plan_id = payload.plan_id.lower()
    currency = payload.currency.upper()
    
    # Secure price mapping from backend only (no frontend tampering)
    prices = {
        "starter": {"INR": "799.00", "USD": "9.99"},
        "professional": {"INR": "1999.00", "USD": "24.99"},
        "enterprise": {"INR": "7999.00", "USD": "99.99"}
    }
    
    if plan_id not in prices or currency not in ["INR", "USD"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan_id or currency selection"
        )
        
    amount = prices[plan_id][currency]
    txnid = f"TXN{int(time.time())}{random.randint(1000, 9999)}"
    productinfo = f"SenseGrid {plan_id.capitalize()} SaaS Subscription"
    firstname = current_user.full_name or "IoT Administrator"
    email = current_user.email
    phone = current_user.phone_number or "9999999999"
    
    # Dynamic origin check for redirect surl/furl and callback redirects
    origin = request.headers.get("origin") or FRONTEND_URL
    origin = origin.rstrip("/")
    
    # PayU Secure Hash Formula:
    # sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    # We will pass plan_id in udf1, currency in udf2, and origin in udf3
    udf1 = plan_id
    udf2 = currency
    udf3 = origin
    
    hash_sequence = f"{PAYU_KEY}|{txnid}|{amount}|{productinfo}|{firstname}|{email}|{udf1}|{udf2}|{udf3}||||||||{PAYU_SALT}"
    tx_hash = hashlib.sha512(hash_sequence.encode('utf-8')).hexdigest().lower()
    
    surl = f"{BACKEND_URL}/api/v1/payment/callback"
    furl = f"{BACKEND_URL}/api/v1/payment/callback"
    
    return {
        "payu_url": PAYU_GATEWAY_URL,
        "key": PAYU_KEY,
        "txnid": txnid,
        "amount": amount,
        "productinfo": productinfo,
        "firstname": firstname,
        "email": email,
        "phone": phone,
        "surl": surl,
        "furl": furl,
        "hash": tx_hash,
        "udf1": udf1,
        "udf2": udf2,
        "udf3": udf3
    }

@router.post("/callback")
def payment_callback(
    request: Request,
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
            url=f"{udf3}/profile?payment=error&reason=hash_mismatch",
            status_code=status.HTTP_303_SEE_OTHER
        )
        
    if status.lower() == "success":
        # Find user and upgrade their subscription plan
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user.subscription_plan = udf1.lower()
            user.subscription_status = "active"
            user.subscription_currency = udf2.upper()
            db.commit()
            print(f"Transaction success: Upgraded user {email} to {udf1}")
            
        return RedirectResponse(
            url=f"{udf3}/profile?payment=success&plan={udf1}&txnid={txnid}",
            status_code=status.HTTP_303_SEE_OTHER
        )
    else:
        print(f"Transaction failed for {email} on callback. Status: {status}")
        return RedirectResponse(
            url=f"{udf3}/profile?payment=failure&txnid={txnid}",
            status_code=status.HTTP_303_SEE_OTHER
        )
