"""
feedback_model.py
Handles database operations related to feedback
"""

from database import get_connection

def save_feedback(data_tuple):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO feedback 
        (student_name, teacher_name, rating, comment, cgpa, sentiment, cognitive_score, weighted_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, data_tuple)

    conn.commit()
    conn.close()