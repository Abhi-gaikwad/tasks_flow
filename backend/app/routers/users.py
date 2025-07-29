# your_project/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, crud, models
from ..database import get_db
from ..dependencies import get_current_user, get_current_admin_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# Move the user creation endpoint here from main.py
@router.post("/", response_model=schemas.UserInDB, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

# Keep the `users/me` endpoint here as it's user-specific
@router.get("/me/", response_model=schemas.UserInDB)
async def read_users_me(current_user: schemas.UserInDB = Depends(get_current_user)):
    """
    Get current authenticated user's details.
    """
    return current_user

# Move the admin-only endpoint to get all users here
@router.get("/", response_model=List[schemas.UserInDB])
async def read_all_users_admin(
    db: Session = Depends(get_db),
    current_admin: schemas.UserInDB = Depends(get_current_admin_user)
):
    """
    Retrieve all users (admin only).
    """
    users = db.query(models.User).all()
    return users

@router.get("/{user_id}", response_model=schemas.UserInDB)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: schemas.UserInDB = Depends(get_current_admin_user)
):
    """
    Retrieve a single user by ID (admin only).
    """
    user = crud.get_user_by_id(db, user_id=user_id) # Need to create get_user_by_id in crud.py
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=schemas.UserInDB)
def update_user(
    user_id: int,
    user_update: schemas.UserCreate, # Consider a separate UserUpdate schema that allows partial updates
    db: Session = Depends(get_db),
    current_admin: schemas.UserInDB = Depends(get_current_admin_user)
):
    """
    Update a user's details (admin only).
    """
    db_user = crud.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Need to add an `update_user` function in crud.py
    # Example: crud.update_user(db: Session, db_user: models.User, user_update_data: dict)
    updated_user = crud.update_user(db=db, db_user=db_user, user_update_data=user_update.model_dump(exclude_unset=True))
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: schemas.UserInDB = Depends(get_current_admin_user)
):
    """
    Delete a user (admin only).
    """
    db_user = crud.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Need to add a `delete_user` function in crud.py
    crud.delete_user(db=db, user_id=user_id)
    return {"message": "User deleted successfully"}