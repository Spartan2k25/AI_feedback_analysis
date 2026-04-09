"""
app.py
Main application entry point
"""

import os
from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.feedback_routes import feedback_bp

app = Flask(__name__)
CORS(app)

# Initialize database
init_db()

# Register routes
app.register_blueprint(feedback_bp)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)