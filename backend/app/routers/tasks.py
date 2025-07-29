# your_project/routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import schemas, crud, models
from ..database import get_db
from ..dependencies import get_current_user, get_current_admin_user # Import admin dependency as well

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)

# You'll need to define a Task and TaskCreate schema in schemas.py first.
# For demonstration, let's assume a basic Task schema for now.
# Please ensure your schemas.py contains these:
# class TaskBase(BaseModel):
#     title: str
#     description: Optional[str] = None
#     status: str = "pending" # e.g., "pending", "in-progress", "completed"
#     priority: str = "medium" # e.g., "low", "medium", "high", "urgent"
#     assignedTo: Optional[int] = None # User ID
#     dueDate: datetime
#
# class TaskCreate(TaskBase):
#     pass
#
# class Task(TaskBase):
#     id: int
#     owner_id: int # User who created the task
#     created_at: datetime
#
#     class Config:
#         from_attributes = True

# Also, you'll need to add a Task model to models.py:
# class Task(Base):
#     __tablename__ = "tasks"
#     id = Column(Integer, primary_key=True, index=True)
#     title = Column(String, index=True)
#     description = Column(String, nullable=True)
#     status = Column(String, default="pending")
#     priority = Column(String, default="medium")
#     assignedTo = Column(Integer, ForeignKey("users.id"), nullable=True)
#     owner_id = Column(Integer, ForeignKey("users.id")) # Creator of the task
#     created_at = Column(DateTime, default=datetime.utcnow)
#     # relationships (optional for now, but good for larger apps)
#     assigned_to_user = relationship("User", foreign_keys=[assignedTo], backref="assigned_tasks")
#     owner_user = relationship("User", foreign_keys=[owner_id], backref="created_tasks")


@router.post("/", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserInDB = Depends(get_current_user)
):
    """
    Create a new task. Only authenticated users can create tasks.
    Admins can assign tasks to anyone; regular users create tasks for themselves or a specific assignedTo user.
    """
    # Ensure the task has an owner (the current user)
    task_data = task.model_dump()
    # If assignedTo is not provided, assign to the creator by default for non-admins
    if not task_data.get("assignedTo") and not current_user.is_admin:
        task_data["assignedTo"] = current_user.id
    # If a regular user tries to assign to someone else, prevent it unless they are admin
    elif not current_user.is_admin and task_data.get("assignedTo") != current_user.id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Regular users can only assign tasks to themselves."
        )

    # Need to add a `create_task` function in crud.py
    # It should take db, task_data, and owner_id
    # Example: crud.create_task(db: Session, task_data: dict, owner_id: int)
    db_task = crud.create_task(db=db, task_data=task_data, owner_id=current_user.id)
    return db_task

@router.get("/", response_model=List[schemas.Task])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserInDB = Depends(get_current_user)
):
    """
    Retrieve tasks. Admins can see all tasks.
    Regular users can only see tasks they created or are assigned to.
    """
    if current_user.is_admin:
        # Need to add a `get_tasks` function in crud.py that fetches all tasks
        tasks = crud.get_tasks(db, skip=skip, limit=limit)
    else:
        # Need to add a `get_user_tasks` function in crud.py
        # This function should fetch tasks where owner_id or assignedTo matches current_user.id
        tasks = crud.get_user_tasks(db, user_id=current_user.id, skip=skip, limit=limit)
    return tasks

@router.get("/{task_id}", response_model=schemas.Task)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserInDB = Depends(get_current_user)
):
    """
    Retrieve a single task by ID.
    Admins can access any task. Regular users can only access tasks they created or are assigned to.
    """
    # Need to add a `get_task` function in crud.py
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if not current_user.is_admin and \
       db_task.owner_id != current_user.id and \
       db_task.assignedTo != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this task")
    return db_task

@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    task_update: schemas.TaskCreate, # Or a separate TaskUpdate schema
    db: Session = Depends(get_db),
    current_user: schemas.UserInDB = Depends(get_current_user)
):
    """
    Update an existing task.
    Admins can update any task. Regular users can only update tasks they created or are assigned to.
    """
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if not current_user.is_admin and \
       db_task.owner_id != current_user.id and \
       db_task.assignedTo != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    # If a regular user tries to change assignedTo, prevent it unless they are admin
    if not current_user.is_admin and \
       task_update.assignedTo is not None and \
       task_update.assignedTo != db_task.assignedTo and \
       task_update.assignedTo != current_user.id: # Allow re-assigning to self
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Regular users cannot reassign tasks to others."
        )

    # Need to add an `update_task` function in crud.py
    # Example: crud.update_task(db: Session, db_task: models.Task, task_update: schemas.TaskCreate)
    updated_task = crud.update_task(db=db, db_task=db_task, task_update_data=task_update.model_dump(exclude_unset=True))
    return updated_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserInDB = Depends(get_current_user)
):
    """
    Delete a task.
    Admins can delete any task. Regular users can only delete tasks they created.
    """
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if not current_user.is_admin and db_task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    # Need to add a `delete_task` function in crud.py
    crud.delete_task(db=db, task_id=task_id)
    return {"message": "Task deleted successfully"}