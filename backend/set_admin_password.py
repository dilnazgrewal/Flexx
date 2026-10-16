"""Change a user's password on whatever database DATABASE_URL points at.

    .venv/Scripts/python.exe set_admin_password.py

Prompts for the password instead of taking it as an argument, so it never
lands in shell history, scrollback, or the process list (on Linux/macOS any
user can read another process's command line with `ps`).
"""

import getpass
import sys

from sqlalchemy import text

from app.database import engine
from app.security import hash_password, verify_password

EMAIL = "admin@flexx.com"

with engine.connect() as conn:
    row = conn.execute(
        text("SELECT id, password_hash FROM users WHERE email = :e"), {"e": EMAIL}
    ).first()

if row is None:
    sys.exit(f"No user {EMAIL} in this database.")

print(f"Changing the password for {EMAIL}")
print("(typing is hidden - no characters will appear)\n")

pw = getpass.getpass("New password: ")
if len(pw) < 10:
    sys.exit("Too short - use at least 10 characters.")
if pw != getpass.getpass("Confirm:      "):
    sys.exit("They don't match. Nothing was changed.")
if verify_password(pw, row.password_hash):
    sys.exit("That's the password it already has. Pick a different one.")

with engine.connect() as conn:
    conn.execute(
        text("UPDATE users SET password_hash = :h WHERE email = :e"),
        {"h": hash_password(pw), "e": EMAIL},
    )
    conn.commit()
    check = conn.execute(
        text("SELECT password_hash FROM users WHERE email = :e"), {"e": EMAIL}
    ).scalar()

print("\nPassword changed." if verify_password(pw, check) else "\nFAILED - unchanged.")
print("Old password 'FlexxAdmin123!' now rejected:", not verify_password("FlexxAdmin123!", check))
