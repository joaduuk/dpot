from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import auth, pots
from app.routers import auth, pots, payments, agents, admin


load_dotenv()

app = FastAPI(
    title="DailyPot API",
    description="Daily Savings Collection Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pots.router)
app.include_router(payments.router)
app.include_router(agents.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {"message": "Welcome to DailyPot API", "status": "operational"}

@app.get("/health")
def health():
    return {"status": "healthy"}