"""
database.py
Handles database connection and initialization
"""

import sqlite3

DATABASE_NAME = "database.db"

def get_connection():
    return sqlite3.connect(DATABASE_NAME)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT,
            teacher_name TEXT,
            rating REAL,
            comment TEXT,
            cgpa REAL,
            sentiment REAL,
            cognitive_score REAL,
            weighted_score REAL
        )
    """)

    conn.commit()
    conn.close()