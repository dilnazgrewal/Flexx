"""Verify the DATABASE_URL in backend/.env actually connects.

Run:  .venv/Scripts/python.exe check_db.py
Prints no password - safe to paste the output anywhere.
"""
import re
import sys

from sqlalchemy import text

from app.config import settings
from app.database import engine

url = settings.database_url
safe = re.sub(r"://([^:]+):[^@]+@", r"://\1:****@", url)
print("DATABASE_URL:", safe)

if url.startswith("sqlite"):
    print("\n>>> Still pointing at local SQLite.")
    print("    Add the DATABASE_URL line to backend/.env and run this again.")
    sys.exit(1)

if url.startswith("postgresql://"):
    print("\n>>> Scheme is 'postgresql://' - SQLAlchemy will look for psycopg2.")
    print("    Change it to 'postgresql+psycopg://' in backend/.env.")
    sys.exit(1)

try:
    with engine.connect() as conn:
        version = conn.execute(text("SELECT version()")).scalar()
        tables = conn.execute(text(
            "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
        )).scalar()
    print("\nCONNECTED OK")
    print("server :", version.split(",")[0])
    print("tables :", tables, "(0 is expected before seeding)")
except Exception as e:
    print("\nCONNECTION FAILED")
    print(type(e).__name__, str(e)[:400])
    sys.exit(1)
