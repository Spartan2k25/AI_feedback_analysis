import React, { useState } from "react";
import { submitFeedback } from "../services/api";

function FeedbackForm() {
  const [studentName, setStudentName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const validateInput = () => {
    const newErrors = {};
    const trimmedStudent = studentName.trim();
    const trimmedTeacher = teacherName.trim();
    const trimmedComment = comment.trim();
    const words = trimmedComment.split(/\s+/).filter(Boolean);
    const longWords = words.filter((word) => word.length > 2);

    if (!trimmedStudent) {
      newErrors.studentName = "Student name is required.";
    } else if (!/^[A-Za-z ]+$/.test(trimmedStudent) || trimmedStudent.length < 3) {
      newErrors.studentName = "Enter a valid student name using letters and spaces.";
    }

    if (!trimmedTeacher) {
      newErrors.teacherName = "Teacher name is required.";
    } else if (!/^[A-Za-z ]+$/.test(trimmedTeacher) || trimmedTeacher.length < 3) {
      newErrors.teacherName = "Enter a valid teacher name using letters and spaces.";
    }

    const ratingValue = Number(rating);
    if (
      rating === "" ||
      Number.isNaN(ratingValue) ||
      !Number.isInteger(ratingValue) ||
      ratingValue < 0 ||
      ratingValue > 5
    ) {
      newErrors.rating = "Rating must be an integer between 0 and 5.";
    }

    const cgpaValue = Number(cgpa);
    const cgpaText = String(cgpa);
    const hasMaxTwoDecimals = /^\d+(?:\.\d{1,2})?$/.test(cgpaText);
    if (
      cgpa === "" ||
      Number.isNaN(cgpaValue) ||
      cgpaValue < 1 ||
      cgpaValue > 10 ||
      !hasMaxTwoDecimals
    ) {
      newErrors.cgpa = "CGPA must be a number between 1 and 10 with up to 2 decimals.";
    }

    if (!trimmedComment) {
      newErrors.comment = "Feedback comment is required.";
    } else if (trimmedComment.length < 20) {
      newErrors.comment = "Write at least 20 characters so your feedback is meaningful.";
    } else if (words.length < 3 || longWords.length < 2 || !/[aeiou]/i.test(trimmedComment)) {
      newErrors.comment = "Use a clear, meaningful sentence with at least 3 words.";
    }

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateInput();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setResult(null);
      setApiError("");
      return;
    }

    setErrors({});
    setApiError("");

    try {
      const response = await submitFeedback({
        student_name: studentName.trim(),
        teacher_name: teacherName.trim(),
        rating: Number(rating),
        comment: comment.trim(),
        cgpa: Number(cgpa),
      });

      setResult(response.data);
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        "Unable to submit feedback at this time.";
      setApiError(message);
      setResult(null);
    }
  };

  const getInputClass = (field) =>
    errors[field] ? "form-control is-invalid" : "form-control";

  const getTransparentStyle = (value) => ({
    backgroundColor: value === "" ? "transparent" : undefined,
    color: value === "" ? "rgba(0, 0, 0, 0.65)" : undefined,
  });

  const handleRatingKeyDown = (event) => {
    const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "Home", "End"];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const currentValue = event.target.value;
    const selectionLength = event.target.selectionEnd - event.target.selectionStart;
    if (currentValue.length === 1 && selectionLength === 0) {
      event.preventDefault();
      return;
    }

    const nextValue = currentValue.slice(0, event.target.selectionStart) + event.key + currentValue.slice(event.target.selectionEnd);
    const intValue = Number(nextValue);
    if (intValue < 0 || intValue > 5) {
      event.preventDefault();
    }
  };

  const handleCgpaKeyDown = (event) => {
    const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "Home", "End", "."];
    if (allowedKeys.includes(event.key) || event.key === "Enter") {
      if (event.key === "." && event.target.value.includes(".")) {
        event.preventDefault();
      }
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleRatingChange = (value) => {
    if (value === "") {
      setRating("");
      return;
    }

    if (!/^[0-9]$/.test(value)) {
      return;
    }

    const intValue = Number(value);
    if (intValue < 0 || intValue > 5) {
      return;
    }

    setRating(String(intValue));
  };

  const handleCgpaChange = (value) => {
    if (value === "") {
      setCgpa("");
      return;
    }

    if (!/^(?:[1-9]|10)(?:\.\d{0,2})?$/.test(value)) {
      return;
    }

    setCgpa(value);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm feedback-card">
          <div className="card-header feedback-header">
            <div>
              <h2 className="card-title mb-1">Student Feedback</h2>
              <p className="card-subtitle text-muted">Share your teaching experience with clear and meaningful comments.</p>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="studentName" className="form-label">Student Name</label>
                <input
                  type="text"
                  className={getInputClass("studentName")}
                  id="studentName"
                  placeholder="Enter your name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
                {errors.studentName && <div className="invalid-feedback">{errors.studentName}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="teacherName" className="form-label">Teacher Name</label>
                <input
                  type="text"
                  className={getInputClass("teacherName")}
                  id="teacherName"
                  placeholder="Enter teacher name"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                />
                {errors.teacherName && <div className="invalid-feedback">{errors.teacherName}</div>}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label htmlFor="rating" className="form-label">Rating (0-5)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={getInputClass("rating")}
                    id="rating"
                    placeholder="0"
                    min="0"
                    max="5"
                    step="1"
                    value={rating}
                    style={getTransparentStyle(rating)}
                    onKeyDown={handleRatingKeyDown}
                    onChange={(e) => handleRatingChange(e.target.value)}
                  />
                  {errors.rating && <div className="invalid-feedback">{errors.rating}</div>}
                </div>
                <div className="col-md-6">
                  <label htmlFor="cgpa" className="form-label">CGPA (1-10)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className={getInputClass("cgpa")}
                    id="cgpa"
                    placeholder="0"
                    min="1"
                    max="10"
                    step="0.01"
                    value={cgpa}
                    style={getTransparentStyle(cgpa)}
                    onKeyDown={handleCgpaKeyDown}
                    onChange={(e) => handleCgpaChange(e.target.value)}
                  />
                  {errors.cgpa && <div className="invalid-feedback">{errors.cgpa}</div>}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="comment" className="form-label">Feedback Comment</label>
                <textarea
                  className={getInputClass("comment")}
                  id="comment"
                  rows="5"
                  placeholder="Describe your learning experience with meaningful sentences..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                {errors.comment && <div className="invalid-feedback">{errors.comment}</div>}
              </div>

              {apiError && <div className="alert alert-danger">{apiError}</div>}

              <button type="submit" className="btn btn-primary w-100 btn-submit">
                Submit Feedback
              </button>

              <p className="text-muted small mt-3">
                Please provide constructive feedback with clear sentences so the system can analyze it accurately.
              </p>
            </form>

            {result && (
              <div className="mt-4 feedback-result">
                <h4 className="text-success">Analysis Result</h4>
                <div className="row gy-3">
                  <div className="col-sm-6">
                    <div className="card result-card h-100">
                      <div className="card-body">
                        <h6 className="card-title">Sentiment Score</h6>
                        <p className="card-text display-6 text-primary mb-0">
                          {Number(result.sentiment || 0).toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="card result-card h-100">
                      <div className="card-body">
                        <h6 className="card-title">Cognitive Score</h6>
                        <p className="card-text display-6 text-info mb-0">
                          {Number(result.cognitive_score || 0).toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row gy-3 mt-2">
                  <div className="col-sm-6">
                    <div className="card result-card h-100">
                      <div className="card-body">
                        <h6 className="card-title">Confidence</h6>
                        <p className="card-text display-6 text-warning mb-0">
                          {Number(result.confidence || 0).toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="card result-card h-100">
                      <div className="card-body">
                        <h6 className="card-title">Final Score</h6>
                        <p className="card-text display-6 text-success mb-0">
                          {Number(result.final_score || 0).toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {result.aspects && Object.keys(result.aspects).length > 0 && (
                  <div className="mt-3">
                    <h5>Aspect Analysis</h5>
                    <ul className="list-group">
                      {Object.entries(result.aspects).map(([aspect, score]) => (
                        <li key={aspect} className="list-group-item d-flex justify-content-between align-items-center">
                          {aspect.charAt(0).toUpperCase() + aspect.slice(1)}
                          <span className={`badge ${score > 0 ? "bg-success" : "bg-danger"} rounded-pill`}>
                            {Number(score).toFixed(3)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackForm;