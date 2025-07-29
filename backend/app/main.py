from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from . import models, schemas, crud, auth
from .database import engine, get_db
from .dependencies import get_current_user, get_current_admin_user

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- CORS Configuration ---
# Get frontend origin from environment variable
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")
if not FRONTEND_ORIGIN:
    raise ValueError("FRONTEND_ORIGIN environment variable not set.")

origins = [
    FRONTEND_ORIGIN,
    # Add other origins here if your frontend is deployed elsewhere
    # e.g., "https://your-production-frontend.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- End CORS Configuration ---


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "is_admin": user.is_admin}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.UserInDB)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.UserInDB)
async def read_users_me(current_user: schemas.UserInDB = Depends(get_current_user)):
    return current_user

@app.get("/admin/users/", response_model=list[schemas.UserInDB])
async def read_all_users_admin(db: Session = Depends(get_db), current_admin: schemas.UserInDB = Depends(get_current_admin_user)):
    users = db.query(models.User).all()
    return users
