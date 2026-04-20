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
    <h1>Thank you for your reservation, {data.fullname}!</h1>
    <p>Your trip to {trip_name} has been reserved.</p>
    <p>Your transaction code is: <strong>{transaction_code}</strong></p>
    <p>We look forward to seeing you on your trip!</p>
    """
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, data.email, msg.as_string())
        print(f"Email sent to {data.email}")