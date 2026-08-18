import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, APP_NAME


def send_email(to_email: str, subject: str, html_body: str):
    """
    Plain SMTP sender — works with your Hostinger SMTP or any provider via
    env vars. If SMTP isn't configured yet, logs to the console instead of
    failing, so you can test the reset flow locally before real credentials
    are set — just copy the link from the terminal.
    """
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL] SMTP not configured — would have sent to {to_email}: {subject}")
        print(html_body)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{APP_NAME} <{EMAIL_FROM}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    # Port 465 is implicit SSL from the start of the connection; 587 (and
    # most others) use STARTTLS to upgrade a plain connection instead.
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM, [to_email], msg.as_string())