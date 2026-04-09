#!/usr/bin/env python3
"""Test script to debug feedback processing"""

from sentiment import analyze_sentiment, calculate_cognitive_score, calculate_confidence, aspect_based_sentiment, calculate_final_score  
from models.feedback_model import save_feedback

# Test with the same data
comment = "The teaching was excellent and very clear explanation provided."
cgpa = 8.5
rating = 4

try:
    sentiment = analyze_sentiment(comment)
    print(f"✓ Sentiment analysis: {sentiment}")
    
    cognitive_score = calculate_cognitive_score(cgpa, comment)
    print(f"✓ Cognitive score: {cognitive_score}")
    
    confidence = calculate_confidence(cgpa, comment)
    print(f"✓ Confidence: {confidence}")
    
    final_score = calculate_final_score(rating, sentiment, cognitive_score, confidence)
    print(f"✓ Final score: {final_score}")
    
    aspects = aspect_based_sentiment(comment)
    print(f"✓ Aspects: {aspects}")
    
    save_feedback((
        "John Doe",
        "Jane Smith",
        rating,
        comment,
        cgpa,
        sentiment,
        cognitive_score,
        final_score
    ))
    print("✓ Feedback saved successfully")
    
except Exception as e:
    import traceback
    print(f"✗ Error: {e}")
    traceback.print_exc()
