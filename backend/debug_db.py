"""
Run this once from your backend/ directory to promote a user to ADMIN:
    python debug_db.py

Or pass an email directly:
    python debug_db.py youremail@example.com
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.models import User, UserRole

def promote_to_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ No user found with email: {email}")
            return
        old_role = user.role
        user.role = UserRole.ADMIN
        db.commit()
        db.refresh(user)
        print(f"✅ Promoted '{user.name}' ({user.email})")
        print(f"   Role changed: {old_role} → {user.role}")
    finally:
        db.close()

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print("\n── All Users ──────────────────────────")
        for u in users:
            print(f"  [{u.id}] {u.email:30s}  role={u.role.value}")
        print("────────────────────────────────────────\n")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
    if len(sys.argv) > 1:
        promote_to_admin(sys.argv[1])
    else:
        email = input("Enter email to promote to ADMIN (or press Enter to skip): ").strip()
        if email:
            promote_to_admin(email)
            list_users()