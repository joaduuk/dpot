import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT.lower() == "production"

# In production a real secret is mandatory — anyone who knows the fallback
# could sign their own login tokens. Generate one with:
#   python -c "import secrets; print(secrets.token_urlsafe(64))"
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    if IS_PRODUCTION:
        raise RuntimeError("SECRET_KEY must be set when ENVIRONMENT=production")
    SECRET_KEY = "dev-only-insecure-secret"
elif IS_PRODUCTION and len(SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY is too short for production (use at least 32 characters)")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
APP_NAME = os.getenv("APP_NAME", "DailyPot")

# Websites allowed to call the API from a browser, comma-separated.
# Production example: https://dailypot.online,https://www.dailypot.online
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.hostinger.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")        # e.g. noreply@yourdomain.com
SMTP_PASS = os.getenv("SMTP_PASS", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USER)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
