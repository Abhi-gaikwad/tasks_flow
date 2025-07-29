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
#     owner_id = Column(Integer, ForeignKey("users.id"))
#     dueDate = Column(DateTime, nullable=True)
#     created_at = Column(DateTime, default=datetime.utcnow)
#     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


@router.post("/", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserInDB = Depends(get_current_user)
):
    """
    Create a new task.
    """
    return crud.create_user_task(db=db, task=task, owner_id=current_user.id)

@router.get("/", response_model=List[schemas.Task])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserInDB = Depends(get_current_user)
):
    """
    Retrieve all tasks.
    Admins can see all tasks. Regular users can only see tasks they created or are assigned to.
    """
    if current_user.is_admin:
        tasks = crud.get_tasks(db, skip=skip, limit=limit)
    else:
        # For regular users, retrieve tasks they created or are assigned to
        tasks = db.query(models.Task).filter(
            (models.Task.owner_id == current_user.id) |
            (models.Task.assignedTo == current_user.id)
        ).offset(skip).limit(limit).all()
    return tasks

@router.get("/{task_id}", response_model=schemas.Task)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserInDB = Depends(get_current_user)
):
    """
    Retrieve a specific task by ID.
    Admins can see any task. Regular users can only see tasks they created or are assigned to.
    """
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if not current_user.is_admin and \
       db_task.owner_id != current_user.id and \
       db_task.assignedTo != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this task"
        )
    return db_task


@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserInDB = Depends(get_current_user)
):
    """
    Update an existing task.
    Admins can update any task. Regular users can update tasks they created or are assigned to.
    Regular users cannot reassign tasks to other users unless they are also the creator.
    """
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Authorization check
    if not current_user.is_admin and \
       db_task.owner_id != current_user.id and \
       db_task.assignedTo != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this task."
        )

    # Specific rule for regular users: cannot reassign to others
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this task."
        )

    crud.delete_task(db, task_id=task_id)
    return {"detail": "Task deleted successfully"}