"""
feedback_routes.py
Contains API routes related to feedback processing
"""

import re
from flask import Blueprint, request, jsonify
from sentiment import (
    analyze_sentiment,
    calculate_cognitive_score,
    calculate_confidence,
    aspect_based_sentiment,
    calculate_final_score
)
from models.feedback_model import save_feedback

feedback_bp = Blueprint("feedback", __name__)


# ---------------------------------------------------
# Submit Feedback Route
# ---------------------------------------------------

@feedback_bp.route("/submit-feedback", methods=["POST"])
def submit_feedback():
    print("[DEBUG] ==> submit_feedback() called")
    try:
        data = request.json or {}
        student_name = str(data.get("student_name", "")).strip()
        teacher_name = str(data.get("teacher_name", "")).strip()
        comment = str(data.get("comment", "")).strip()

        print(f"[DEBUG] Received data: student={student_name}, teacher={teacher_name}")

        try:
            rating_raw = data.get("rating", "")
            rating = float(rating_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "Rating must be an integer between 0 and 5."}), 400

        try:
            cgpa_raw = data.get("cgpa", "")
            cgpa = float(cgpa_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "CGPA must be a number between 1 and 10 with up to 2 decimals."}), 400

        if not student_name or not teacher_name:
            return jsonify({"error": "Student name and teacher name are required."}), 400

        if not all(ch.isalpha() or ch.isspace() for ch in student_name) or len(student_name) < 3:
            return jsonify({"error": "Enter a valid student name using letters and spaces."}), 400

        if not all(ch.isalpha() or ch.isspace() for ch in teacher_name) or len(teacher_name) < 3:
            return jsonify({"error": "Enter a valid teacher name using letters and spaces."}), 400

        if rating < 0 or rating > 5 or rating != int(rating):
            return jsonify({"error": "Rating must be an integer between 0 and 5."}), 400

        cgpa_text = str(cgpa_raw).strip()
        if cgpa < 1 or cgpa > 10 or not re.match(r"^\d+(?:\.\d{1,2})?$", cgpa_text):
            return jsonify({"error": "CGPA must be between 1 and 10 with up to 2 decimals."}), 400

        words = [word for word in comment.split() if word]
        if len(comment) < 20 or len(words) < 3 or not any(v in comment.lower() for v in "aeiou"):
            return jsonify({"error": "Please provide a meaningful comment with at least 3 words."}), 400

        print("[DEBUG] Validation passed, starting AI processing")

        # ---------------- AI PROCESSING ----------------
        
        try:
            # 1️⃣ Transformer Sentiment
            print("[DEBUG] Calling analyze_sentiment()...")
            sentiment = analyze_sentiment(comment)
            print(f"[DEBUG] Sentiment result: {sentiment}")

            # 2️⃣ Cognitive Weight
            print("[DEBUG] Calling calculate_cognitive_score()...")
            cognitive_score = calculate_cognitive_score(cgpa, comment)
            print(f"[DEBUG] Cognitive score: {cognitive_score}")

            # 3️⃣ Bias Confidence
            print("[DEBUG] Calling calculate_confidence()...")
            confidence = calculate_confidence(cgpa, comment)
            print(f"[DEBUG] Confidence: {confidence}")

            # 4️⃣ Final Research Score
            print("[DEBUG] Calling calculate_final_score()...")
            final_score = calculate_final_score(
                rating,
                sentiment,
                cognitive_score,
                confidence
            )
            print(f"[DEBUG] Final score: {final_score}")

            # 5️⃣ Aspect-Based Sentiment
            print("[DEBUG] Calling aspect_based_sentiment()...")
            aspects = aspect_based_sentiment(comment)
            print(f"[DEBUG] Aspects: {aspects}")

        except Exception as e:
            print(f"[ERROR] Error during AI processing: {e}")
            import traceback
            traceback.print_exc()
            # Use safe default values if AI processing fails
            sentiment = 0.0
            cognitive_score = cgpa / 10
            confidence = 0.5
            final_score = (rating + cgpa) / 7.5
            aspects = {}

        # ---------------- SAVE TO DATABASE ----------------
        # (Temporarily saving final_score as weighted_score column)

        print("[DEBUG] Attempting to save feedback...")
        try:
            save_feedback((
                student_name,
                teacher_name,
                rating,
                comment,
                cgpa,
                sentiment,
                cognitive_score,
                final_score
            ))
            print("[DEBUG] Feedback saved successfully")
        except Exception as e:
            print(f"[ERROR] Error saving feedback to database: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Failed to save feedback. Please try again."}), 500

        # ---------------- RESPONSE ----------------
        print("[DEBUG] Returning success response")

        return jsonify({
            "sentiment": sentiment,
            "cognitive_score": cognitive_score,
            "confidence": confidence,
            "final_score": final_score,
            "aspects": aspects
        })
    except Exception as e:
        print(f"[ERROR] Uncaught exception in submit_feedback: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500


# ---------------------------------------------------
# Analytics Route
# ---------------------------------------------------

@feedback_bp.route("/analytics", methods=["GET"])
def get_analytics():

    from database import get_connection

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT teacher_name,
               COUNT(*) as feedback_count,
               AVG(rating) as avg_rating,
               AVG(sentiment) as avg_sentiment,
               AVG(cognitive_score) as avg_cognitive,
               AVG(weighted_score) as avg_final_score,
               MIN(weighted_score) as min_score,
               MAX(weighted_score) as max_score
        FROM feedback
        GROUP BY teacher_name
        ORDER BY avg_final_score DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    result = []

    for row in rows:
        result.append({
            "teacher_name": row[0],
            "feedback_count": row[1],
            "avg_rating": round(row[2], 2) if row[2] else 0,
            "avg_sentiment": round(row[3], 3) if row[3] else 0,
            "avg_cognitive": round(row[4], 3) if row[4] else 0,
            "avg_final_score": round(row[5], 3) if row[5] else 0,
            "min_score": round(row[6], 3) if row[6] else 0,
            "max_score": round(row[7], 3) if row[7] else 0
        })

    return jsonify(result)


@feedback_bp.route("/feedback/<int:feedback_id>", methods=["DELETE"])
def delete_feedback(feedback_id):
    from database import get_connection

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM feedback WHERE id = ?", (feedback_id,))
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Feedback record not found."}), 404

    conn.commit()
    conn.close()
    return jsonify({"message": "Feedback record deleted successfully."}), 200


# ---------------------------------------------------
# Detailed Feedback Route
# ---------------------------------------------------

@feedback_bp.route("/feedback-details/<teacher_name>", methods=["GET"])
def get_feedback_details(teacher_name):

    from database import get_connection

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, student_name, rating, comment, cgpa, sentiment, cognitive_score, weighted_score
        FROM feedback
        WHERE teacher_name = ?
        ORDER BY weighted_score DESC
    """, (teacher_name,))

    rows = cursor.fetchall()
    conn.close()

    result = []

    for row in rows:
        result.append({
            "id": row[0],
            "student_name": row[1],
            "rating": row[2],
            "comment": row[3],
            "cgpa": row[4],
            "sentiment": round(row[5], 3),
            "cognitive_score": round(row[6], 3),
            "final_score": round(row[7], 3)
        })

    return jsonify(result)