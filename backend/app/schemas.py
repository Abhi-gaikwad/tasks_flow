# your_project/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    is_admin: bool = False

class UserInDB(UserBase):
    id: int
    is_admin: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
    is_admin: bool = False

# --- Task Schemas ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending" # e.g., "pending", "in-progress", "completed"
    priority: str = "medium" # e.g., "low", "medium", "high", "urgent"
    assignedTo: Optional[int] = None # User ID

    # Make dueDate optional in TaskBase for creation, or define a specific TaskCreate with it
    dueDate: Optional[datetime] = None

class TaskCreate(TaskBase):
    # All fields from TaskBase are inherited, no need to redefine
    # You might want to make dueDate mandatory for creation, if so:
    dueDate: datetime # Override to make it mandatory for creation


class Task(TaskBase):
    id: int
    owner_id: int # User who created the task
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Optional: For updating tasks, you might want a schema that allows partial updates
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignedTo: Optional[int] = None
    dueDate: Optional[datetime] = None