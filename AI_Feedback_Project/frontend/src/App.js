import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import FeedbackForm from "./components/FeedbackForm";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [view, setView] = useState("form");

  return (
    <div className="container-fluid">
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand">AI Teaching Feedback System</span>
          <div className="navbar-nav ms-auto">
            <button
              className={`nav-link btn ${view === "form" ? "btn-primary" : "btn-outline-primary"} me-2`}
              onClick={() => setView("form")}
            >
              Student View
            </button>
            <button
              className={`nav-link btn ${view === "admin" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setView("admin")}
            >
              Admin View
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="container mt-4">
        {view === "form" ? <FeedbackForm /> : <AdminDashboard />}
      </div>
    </div>
  );
}

export default App;