import os
import time
from collections import defaultdict, deque
from html import escape

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from app.core.email import send_email

router = APIRouter(tags=["Contact"])

# Where contact-form messages are delivered.
CONTACT_TO = os.getenv("CONTACT_TO", "support@dailypot.online")

# Simple in-memory limit per IP. Fine for one uvicorn process; it resets on
# restart, which is acceptable for a contact form.
RATE_LIMIT_COUNT = 5
RATE_LIMIT_WINDOW_SECONDS = 60 * 60
_recent: dict[str, deque] = defaultdict(deque)


class ContactMessage(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=150)
    message: str = Field(min_length=10, max_length=5000)
    # Honeypot: hidden on the form, so only bots fill it in.
    website: str = Field(default="", max_length=200)


def _client_ip(request: Request) -> str:
    host = request.client.host if request.client else "unknown"
    # Behind nginx every request comes from loopback, so use the address
    # nginx passes on. Only trust the header when it came from the proxy.
    if host in ("127.0.0.1", "::1"):
        return request.headers.get("x-real-ip") or host
    return host


def _rate_limited(ip: str) -> bool:
    now = time.monotonic()
    hits = _recent[ip]
    while hits and now - hits[0] > RATE_LIMIT_WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= RATE_LIMIT_COUNT:
        return True
    hits.append(now)
    return False


# Not "/contact": that's the frontend page's path, and keeping API and page
# paths distinct avoids routing mix-ups if both are ever served from one host.
@router.post("/contact-message")
def submit_contact_message(data: ContactMessage, request: Request):
    # Pretend success so bots don't learn the honeypot exists.
    if data.website.strip():
        return {"message": "Thanks — your message has been sent."}

    if _rate_limited(_client_ip(request)):
        raise HTTPException(status_code=429, detail="Too many messages. Please try again later, or email us directly.")

    name = data.name.strip()
    # Collapse whitespace so the subject can't carry extra header lines.
    subject = " ".join(data.subject.split())
    message_html = escape(data.message.strip()).replace("\n", "<br>")

    html_body = f"""
    <p><strong>From:</strong> {escape(name)} &lt;<a href="mailto:{escape(data.email)}">{escape(data.email)}</a>&gt;</p>
    <p><strong>Subject:</strong> {escape(subject)}</p>
    <hr>
    <p>{message_html}</p>
    <hr>
    <p style="color:#6B7280;font-size:12px">Sent from the DailyPot contact form. Reply to the address above, not to this email.</p>
    """
    # Send before answering, so the form only reports success if it worked.
    try:
        send_email(CONTACT_TO, f"[Contact] {subject}", html_body)
    except Exception as exc:
        print(f"[CONTACT] Failed to send message from {data.email}: {exc}")
        raise HTTPException(status_code=502, detail="We couldn't send your message just now. Please email us directly.")
    return {"message": "Thanks — your message has been sent."}
