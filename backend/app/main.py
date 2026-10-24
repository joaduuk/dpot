from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.core.config import ALLOWED_ORIGINS, IS_PRODUCTION
from app.routers import auth, pots, payments, agents, admin, contact


load_dotenv()

# Swagger/ReDoc are handy locally but give attackers a map of the API, so
# they're switched off in production (nginx blocks the paths as well).
app = FastAPI(
    title="DailyPot API",
    description="Daily Savings Collection Platform",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pots.router)
app.include_router(payments.router)
app.include_router(agents.router)
app.include_router(admin.router)
app.include_router(contact.router)

@app.get("/")
def root():
    return {"message": "Welcome to DailyPot API", "status": "operational"}

@app.get("/health")
def health():
    return {"status": "healthy"}
