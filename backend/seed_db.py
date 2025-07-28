# D:\Prasaar Tech\task-main\backend\seed_db.py

from app import crud, schemas, database # This line is correct if seed_db.py is OUTSIDE the 'app' directory
from sqlalchemy.orm import Session

def create_demo_users(db: Session):
    admin_email = "admin@gmail.com"
    user_email = "user@gmail.com"
    password = "password" # For demo, in real app, use different, strong passwords

    # Create admin user if not exists
    if not crud.get_user_by_email(db, admin_email):
        admin_user = schemas.UserCreate(email=admin_email, password=password, is_admin=True)
        crud.create_user(db, admin_user)
        print(f"Created admin user: {admin_email}")
    else:
        print(f"Admin user {admin_email} already exists.")

    # Create regular user if not exists
    if not crud.get_user_by_email(db, user_email):
        regular_user = schemas.UserCreate(email=user_email, password=password, is_admin=False)
        crud.create_user(db, regular_user)
        print(f"Created regular user: {user_email}")
    else:
        print(f"Regular user {user_email} already exists.")

if __name__ == "__main__":
    db = database.SessionLocal()
    try:
        create_demo_users(db)
    finally:
        db.close()