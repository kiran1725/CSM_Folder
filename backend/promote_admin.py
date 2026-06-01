"""
Run this ONCE from your backend root to promote a user to ADMIN:

    python promote_admin.py your_email@example.com

This is needed because all users register as CUSTOMER by default.
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
            print(f"❌  No user found with email: {email}")
            return

        old_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        user.role = UserRole.ADMIN
        db.commit()
        db.refresh(user)
        new_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        print(f"✅  {user.name} ({user.email}): {old_role} → {new_role}")
    except Exception as e:
        db.rollback()
        print(f"❌  Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
        print("Example: python promote_admin.py kiranadmin@gmail.com")
        sys.exit(1)
    promote_to_admin(sys.argv[1])