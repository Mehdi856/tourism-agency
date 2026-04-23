import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os
from models.models import fullregistration

load_dotenv()
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

def sandbox_email(data: fullregistration, trip_name: str, transaction_code: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Trip Reservation Information"
    msg["From"] = GMAIL_USER
    msg["To"] = data.email

    html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .email-container {{
                    font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                }}
                .header {{
                    background-color: #1a73e8;
                    color: #ffffff;
                    padding: 30px;
                    text-align: center;
                }}
                .content {{
                    padding: 30px;
                    line-height: 1.6;
                    color: #333333;
                }}
                .transaction-box {{
                    background-color: #f8f9fa;
                    border: 1px dashed #1a73e8;
                    padding: 15px;
                    text-align: center;
                    margin: 20px 0;
                    font-size: 18px;
                }}
                .footer {{
                    background-color: #f1f3f4;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #70757a;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1 style="margin:0;">Reservation Confirmed</h1>
                </div>
                <div class="content">
                    <p>Dear {data.fullname},</p>
                    <p>Thank you for choosing us for your upcoming adventure. We are pleased to confirm that your booking for <strong>{trip_name}</strong> has been successfully processed.</p>
                    
                    <div class="transaction-box">
                        <span style="display:block; font-size: 14px; color: #666;">Transaction Reference</span>
                        <strong>{transaction_code}</strong>
                    </div>

                    <p>A member of our team will reach out shortly with the full itinerary and travel requirements. In the meantime, please keep this code for your records.</p>
                    
                    <p>We look forward to hosting you!</p>
                    <p>Best regards,<br><strong>The Travel Team</strong></p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, data.email, msg.as_string())
        print(f"Email sent to {data.email}")