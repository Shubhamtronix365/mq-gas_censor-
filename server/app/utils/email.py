import os
import requests
from typing import Optional, List, Dict

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "noreply@indianiiot.com")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Tronix365 SenseGrid")
SHUBHAM_NOTIFICATION_EMAIL = os.getenv("SHUBHAM_NOTIFICATION_EMAIL", "shubham.tronix365@gmail.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://mq-gas-censor-tronix.pages.dev")

def _get_base_html_template(title: str, content_html: str) -> str:
    """
    Generates a unified, premium HTML email wrapper with custom Tronix365 dark/neon glass style.
    """
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #020617;
                color: #f8fafc;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            .email-wrapper {{
                max-width: 600px;
                margin: 20px auto;
                background-color: #0b132b;
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }}
            .header-banner {{
                background: linear-gradient(135deg, #7c3aed, #06b6d4);
                padding: 40px 20px;
                text-align: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }}
            .header-banner h1 {{
                margin: 0;
                font-size: 26px;
                font-weight: 800;
                letter-spacing: -0.5px;
                color: #ffffff;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }}
            .header-banner p {{
                margin: 5px 0 0 0;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #c084fc;
            }}
            .content-area {{
                padding: 30px 25px;
                background-color: #090f22;
            }}
            .meta-card {{
                background-color: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                padding: 20px;
                margin: 20px 0;
            }}
            .meta-row {{
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            }}
            .meta-row:last-child {{
                border-bottom: none;
            }}
            .meta-label {{
                font-size: 12px;
                color: #94a3b8;
                font-weight: 600;
                text-transform: uppercase;
            }}
            .meta-value {{
                font-size: 13px;
                color: #ffffff;
                font-weight: 700;
            }}
            .btn-action {{
                display: inline-block;
                width: 100%;
                text-align: center;
                background: linear-gradient(135deg, #6d28d9, #5b21b6);
                color: #ffffff !important;
                text-decoration: none;
                padding: 14px 0;
                border-radius: 12px;
                font-weight: 700;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 25px 0 10px 0;
                box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);
            }}
            .btn-action:hover {{
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
            }}
            .footer-notes {{
                text-align: center;
                padding: 20px 25px;
                font-size: 11px;
                color: #64748b;
                background-color: #060b18;
                border-top: 1px solid rgba(255, 255, 255, 0.03);
            }}
            .footer-notes a {{
                color: #8b5cf6;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="header-banner">
                <h1>TRONIX365</h1>
                <p>SenseGrid IoT Telemetry</p>
            </div>
            <div class="content-area">
                {content_html}
            </div>
            <div class="footer-notes">
                This notification is sent automatically from Tronix365 B2B Cloud. <br>
                For compliance issues or custom integration support, contact <a href="mailto:support@indianiiot.com">support@indianiiot.com</a>.
            </div>
        </div>
    </body>
    </html>
    """

def send_brevo_email(to_email: str, subject: str, html_content: str, cc_emails: Optional[List[str]] = None) -> bool:
    """
    Core sender utility hitting Brevo API v3 to send an HTML email.
    """
    if not BREVO_API_KEY:
        print("EMAIL SKIPPED: BREVO_API_KEY environment variable is not defined.")
        return False
        
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
        "accept": "application/json"
    }
    
    payload = {
        "sender": { "name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL },
        "to": [{ "email": to_email }],
        "subject": subject,
        "htmlContent": html_content
    }
    
    # Securely append cc targets
    cc_list = []
    if cc_emails:
        cc_list.extend([{ "email": cc } for cc in cc_emails])
    if SHUBHAM_NOTIFICATION_EMAIL and SHUBHAM_NOTIFICATION_EMAIL not in (cc_emails or []):
        cc_list.append({ "email": SHUBHAM_NOTIFICATION_EMAIL })
        
    if cc_list:
        payload["cc"] = cc_list
        
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in [200, 201, 202]:
            print(f"Brevo email sent successfully to {to_email}")
            return True
        else:
            print(f"Failed to send Brevo email. Code: {response.status_code}, Body: {response.text}")
            return False
    except Exception as e:
        print(f"Error sending Brevo transaction email: {str(e)}")
        return False

def send_subscription_success_email(user_email: str, full_name: str, plan_name: str, amount: str, currency: str, txnid: str):
    subject = "🎉 Payment Successful - Subscription Upgraded!"
    content = f"""
    <h2 style="color: #10b981; margin-top: 0;">Plan Upgraded Successfully!</h2>
    <p>Dear {full_name},</p>
    <p>We are excited to inform you that your payment was successfully processed. Your Tronix365 SenseGrid subscription has been upgraded to <strong>{plan_name.upper()}</strong>.</p>
    
    <div class="meta-card">
        <div class="meta-row">
            <span class="meta-label">Transaction ID</span>
            <span class="meta-value" style="font-family: monospace;">{txnid}</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Plan Tier</span>
            <span class="meta-value" style="color: #a78bfa;">{plan_name.upper()}</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Payment Amount</span>
            <span class="meta-value">{currency} {amount}</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Subscription Status</span>
            <span class="meta-value" style="color: #10b981;">ACTIVE</span>
        </div>
    </div>
    
    <p>All device limits, cold analytical storage capabilities, and alert rules have been automatically updated for your account.</p>
    <a href="{FRONTEND_URL}" class="btn-action">Go to Command Center</a>
    """
    html = _get_base_html_template(subject, content)
    send_brevo_email(to_email=user_email, subject=subject, html_content=html)

def send_subscription_cancellation_email(user_email: str, full_name: str, plan_name: str):
    subject = "⚠️ Subscription Cancellation Request Confirmed"
    content = f"""
    <h2 style="color: #f43f5e; margin-top: 0;">Subscription Downgraded</h2>
    <p>Dear {full_name},</p>
    <p>This email confirms that your subscription plan has been cancelled and downgraded back to the <strong>Free Tier</strong>. We are sorry to see you go!</p>
    
    <div class="meta-card">
        <div class="meta-row">
            <span class="meta-label">Previous Plan</span>
            <span class="meta-value" style="text-decoration: line-through; color: #f43f5e;">{plan_name.upper()}</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Current Plan</span>
            <span class="meta-value" style="color: #cbd5e1;">FREE TIER</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Action Status</span>
            <span class="meta-value" style="color: #f43f5e;">DOWNGRADED</span>
        </div>
    </div>
    
    <p>Please note that any active telemetry devices exceeding the Free limits (maximum of 2 microcontrollers) will be paused. You can upgrade again at any time to restore full metrics limits.</p>
    <a href="{FRONTEND_URL}/subscription" class="btn-action">Review Pricing Tiers</a>
    """
    html = _get_base_html_template(subject, content)
    send_brevo_email(to_email=user_email, subject=subject, html_content=html)

def send_subscription_expiry_warning_email(user_email: str, full_name: str, plan_name: str, expiry_date_str: str, days_left: int):
    subject = f"⚠️ Action Required: Your subscription is expiring in {days_left} Days"
    content = f"""
    <h2 style="color: #fbbf24; margin-top: 0;">Renewal Warning</h2>
    <p>Dear {full_name},</p>
    <p>This is a notification that your <strong>{plan_name.upper()}</strong> subscription is scheduled to end on <strong>{expiry_date_str}</strong> ({days_left} days left).</p>
    
    <div class="meta-card">
        <div class="meta-row">
            <span class="meta-label">Plan Tier</span>
            <span class="meta-value">{plan_name.upper()}</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">End Date</span>
            <span class="meta-value" style="color: #fbbf24;">{expiry_date_str}</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Time Remaining</span>
            <span class="meta-value" style="color: #fbbf24; font-weight: 800;">{days_left} Days Left</span>
        </div>
    </div>
    
    <p>To prevent any service interruption, loss of custom analytic logs, or limits enforcement on your active devices, please review your billing settings or renew your plan below.</p>
    <a href="{FRONTEND_URL}/subscription" class="btn-action">Renew Subscription</a>
    """
    html = _get_base_html_template(subject, content)
    send_brevo_email(to_email=user_email, subject=subject, html_content=html)

def send_general_notification_email(user_email: str, subject: str, title: str, description: str):
    content = f"""
    <h2 style="color: #8b5cf6; margin-top: 0;">{title}</h2>
    <p>{description}</p>
    
    <div class="meta-card">
        <div class="meta-row">
            <span class="meta-label">Account User</span>
            <span class="meta-value">{user_email}</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Event Status</span>
            <span class="meta-value" style="color: #8b5cf6;">NOTIFIED</span>
        </div>
    </div>
    
    <a href="{FRONTEND_URL}" class="btn-action">Access Dashboard</a>
    """
    html = _get_base_html_template(subject, content)
    send_brevo_email(to_email=user_email, subject=subject, html_content=html)
