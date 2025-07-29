# your_project/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship # Import relationship
from datetime import datetime # Import datetime for default value
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    # Optional: Add backrefs to tasks
    # assigned_tasks = relationship("Task", foreign_keys="[Task.assignedTo]", back_populates="assigned_to_user")
    # created_tasks = relationship("Task", foreign_keys="[Task.owner_id]", back_populates="owner_user")


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    status = Column(String, default="pending") # e.g., "pending", "in-progress", "completed"
    priority = Column(String, default="medium") # e.g., "low", "medium", "high", "urgent"
    assignedTo = Column(Integer, ForeignKey("users.id"), nullable=True) # User ID assigned to
    owner_id = Column(Integer, ForeignKey("users.id")) # User ID who created the task
    dueDate = Column(DateTime, nullable=True) # Add due date
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Define relationships
    assigned_to_user = relationship("User", foreign_keys=[assignedTo], backref="assigned_tasks_rel")
    owner_user = relationship("User", foreign_keys=[owner_id], backref="created_tasks_rel")