# your_project/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash
from typing import List, Optional

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, is_admin=user.is_admin)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, db_user: models.User, user_update_data: dict):
    for key, value in user_update_data.items():
        if key == "password" and value: # Hash password if it's being updated
            setattr(db_user, "hashed_password", get_password_hash(value))
        elif hasattr(db_user, key):
            setattr(db_user, key, value)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()


# --- Task CRUD Operations ---
def create_task(db: Session, task_data: dict, owner_id: int):
    db_task = models.Task(**task_data, owner_id=owner_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()

def get_tasks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Task).offset(skip).limit(limit).all()

def get_user_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    # Get tasks where the user is the owner OR assigned to
    return db.query(models.Task).filter(
        (models.Task.owner_id == user_id) | (models.Task.assignedTo == user_id)
    ).offset(skip).limit(limit).all()

def update_task(db: Session, db_task: models.Task, task_update_data: dict):
    for key, value in task_update_data.items():
        setattr(db_task, key, value)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()