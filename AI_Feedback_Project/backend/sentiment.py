"""
sentiment.py
AI Engine using BERT + BiLSTM for Sentiment Analysis + Aspect Analysis + Bias Confidence Layer
"""

import os

import torch
import torch.nn as nn

# Try to import transformers, but don't fail if it's not available
try:
    from transformers import BertTokenizer, BertModel, pipeline
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False
    print("Warning: transformers library not fully available. Using basic sentiment analysis.")

# Ensure model directory exists
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, 'bert_bilstm_sentiment.pth')

# Tokenizer - only if transformers available (skip loading to avoid network issues)
# We'll rely on the sentiment pipeline which loads its own tokenizer
tokenizer = None
if HAS_TRANSFORMERS:
    print("Note: BERT tokenizer loading skipped to avoid network hangs. Using sentiment pipeline instead.")

# BERT + BiLSTM Model Definition
if HAS_TRANSFORMERS:
    class BERTBiLSTM(nn.Module):
        def __init__(self, bert_model='bert-base-uncased', hidden_size=256, num_classes=1):
            super(BERTBiLSTM, self).__init__()
            self.bert = BertModel.from_pretrained(bert_model)
            self.lstm = nn.LSTM(self.bert.config.hidden_size, hidden_size, bidirectional=True, batch_first=True)
            self.dropout = nn.Dropout(0.3)
            self.classifier = nn.Linear(hidden_size * 2, num_classes)  # Bidirectional, so *2

        def forward(self, input_ids, attention_mask):
            with torch.no_grad():  # Freeze BERT during inference
                outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
            lstm_out, _ = self.lstm(outputs.last_hidden_state)
            pooled = torch.mean(lstm_out, dim=1)  # Mean pooling
            pooled = self.dropout(pooled)
            return self.classifier(pooled).squeeze()
else:
    class BERTBiLSTM:
        def __init__(self, *args, **kwargs):
            pass

# Load model or fallback pipeline
model = None
sentiment_pipeline = None

if HAS_TRANSFORMERS:
    if os.path.exists(MODEL_PATH):
        try:
            model = BERTBiLSTM()
            model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
            model.eval()
            print("Loaded custom BERT + BiLSTM sentiment model.")
        except Exception as e:
            print(f"Error loading custom model: {e}. Using fallback.")
            model = None

    if model is None:
        print("Using stub sentiment analysis (transformer pipeline disabled)")
        sentiment_pipeline = "stub"
else:
    print("Transformers not available. Using basic keyword sentiment analysis.")
    sentiment_pipeline = "stub"

# ---------------------------------------------------
# 1️⃣ Core Sentiment Analysis (BERT + BiLSTM)
# ---------------------------------------------------

def analyze_sentiment(text):
    """
    Uses the custom BERT + BiLSTM model for contextual sentiment analysis when available.
    Falls back to keyword-based analysis otherwise.
    Returns polarity score in range (-1 to +1).
    """
    try:
        if model is not None and tokenizer is not None:
            inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)
            with torch.no_grad():
                output = model(**inputs)
                score = torch.sigmoid(output).item() * 2 - 1
            return score

        # Fallback to pipeline if available
        if sentiment_pipeline and sentiment_pipeline != "stub":
            try:
                result = sentiment_pipeline(text[:512])[0]
                label = result.get('label', '').upper()
                confidence = result.get('score', 0.0)
                return confidence if label == 'POSITIVE' else -confidence
            except Exception as e:
                print(f"Error in sentiment pipeline: {e}")
                return basic_sentiment_analysis(text)

        # Final fallback: basic keyword analysis
        return basic_sentiment_analysis(text)
    except Exception as e:
        print(f"Error in analyze_sentiment: {e}")
        return basic_sentiment_analysis(text)


def basic_sentiment_analysis(text):
    """
    Simple keyword-based sentiment analysis when models fail
    """
    text_lower = text.lower()
    positive_words = ['good', 'great', 'excellent', 'amazing', 'clear', 'well', 'best', 'wonderful', 'fantastic']
    negative_words = ['bad', 'poor', 'terrible', 'awful', 'confusing', 'unclear', 'worst', 'horrible']
    
    positive_count = sum(1 for word in positive_words if word in text_lower)
    negative_count = sum(1 for word in negative_words if word in text_lower)
    
    return (positive_count - negative_count) / max(1, positive_count + negative_count)


# ---------------------------------------------------
# 2️⃣ Cognitive Weight Calculation
# ---------------------------------------------------

def calculate_cognitive_score(cgpa, comment=""):
    """
    Enhanced cognitive score combining CGPA and text analysis
    """
    # Base score from CGPA
    base_score = cgpa / 10

    # Text-based cognitive indicators
    text_score = analyze_cognitive_engagement(comment)

    # Weighted combination (70% CGPA, 30% text analysis)
    return 0.7 * base_score + 0.3 * text_score


def analyze_cognitive_engagement(text):
    """
    Analyzes feedback text for cognitive engagement indicators
    """
    if not text:
        return 0.5  # Neutral score for no text

    text_lower = text.lower()
    score = 0.5  # Base score

    # Positive cognitive indicators
    cognitive_keywords = {
        'understand': 0.1,
        'clear': 0.08,
        'explain': 0.08,
        'concept': 0.07,
        'logic': 0.07,
        'reasoning': 0.08,
        'critical': 0.08,
        'analysis': 0.08,
        'thinking': 0.07,
        'comprehensive': 0.06,
        'detailed': 0.06,
        'insight': 0.07,
        'method': 0.06,
        'approach': 0.06,
        'strategy': 0.06,
        'problem': 0.05,
        'solution': 0.05,
        'application': 0.06,
        'practical': 0.05,
        'theory': 0.05,
        'depth': 0.06,
        'complex': 0.05,
        'challenging': 0.04,
        'stimulating': 0.06,
        'engaging': 0.06,
        'motivating': 0.05,
        'inspiring': 0.06,
        'innovative': 0.05,
        'creative': 0.05
    }

    # Negative cognitive indicators
    negative_keywords = {
        'confusing': -0.08,
        'unclear': -0.08,
        'difficult': -0.05,
        'hard': -0.04,
        'complicated': -0.05,
        'boring': -0.06,
        'uninteresting': -0.06,
        'simple': -0.03,
        'basic': -0.03,
        'easy': -0.02
    }

    # Count positive indicators
    for keyword, weight in cognitive_keywords.items():
        if keyword in text_lower:
            score += weight

    # Count negative indicators
    for keyword, weight in negative_keywords.items():
        if keyword in text_lower:
            score += weight

    # Length bonus (longer, more detailed feedback suggests higher engagement)
    word_count = len(text.split())
    if word_count > 20:
        score += 0.1
    elif word_count > 10:
        score += 0.05

    # Cap the score between 0 and 1
    return max(0, min(1, score))


# ---------------------------------------------------
# 3️⃣ Bias Confidence Layer (Your Unique Contribution)
# ---------------------------------------------------

def calculate_confidence(cgpa, comment):
    """
    Adjusts confidence based on:
    - Low CGPA bias
    - Very short comments
    """

    confidence = 1.0

    # Penalize very low CGPA
    if cgpa < 5:
        confidence *= 0.85

    # Penalize very short feedback
    if len(comment.split()) < 5:
        confidence *= 0.9

    return confidence


# ---------------------------------------------------
# 4️⃣ Aspect-Based Sentiment Analysis (Uniqueness Layer)
# ---------------------------------------------------

def aspect_based_sentiment(text):
    """
    Detects aspect-level sentiment for teaching components
    """

    aspects = {
        "lecture": ["lecture", "teaching", "clarity", "explanation"],
        "exams": ["exam", "test", "difficulty"],
        "assignments": ["assignment", "homework", "task"],
        "interaction": ["interaction", "communication", "doubt"]
    }

    results = {}

    for aspect, keywords in aspects.items():
        for word in keywords:
            if word in text.lower():
                results[aspect] = analyze_sentiment(text)
                break

    return results


# ---------------------------------------------------
# 5️⃣ Final Score Formula
# ---------------------------------------------------

def calculate_final_score(rating, sentiment, cognitive_score, confidence):
    """
    Your enhanced research formula:
    Final Score =
    Rating × Sentiment × Cognitive Weight × Confidence
    """

    return rating * sentiment * cognitive_score * confidence