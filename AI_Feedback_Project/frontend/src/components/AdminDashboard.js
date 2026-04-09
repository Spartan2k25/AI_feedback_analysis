import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { deleteFeedback, getAnalytics, getFeedbackDetails } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  const [data, setData] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherDetails, setTeacherDetails] = useState([]);

  const fetchAnalytics = async () => {
    try {
      const response = await getAnalytics();
      setData(response.data);
    } catch (error) {
      console.error("Analytics fetch failed:", error?.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const loadTeacherDetails = async (teacherName) => {
    try {
      const response = await getFeedbackDetails(teacherName);
      setTeacherDetails(response.data);
      setSelectedTeacher(teacherName);
    } catch (error) {
      console.error("Feedback detail fetch failed:", error?.response?.data || error.message);
    }
  };

  const deleteFeedbackRecord = async (recordId) => {
    const confirmed = window.confirm("Delete this feedback record permanently?");
    if (!confirmed) return;

    try {
      await deleteFeedback(recordId);
      await fetchAnalytics();
      if (selectedTeacher) {
        await loadTeacherDetails(selectedTeacher);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to delete the selected feedback record.");
    }
  };

  const chartData = {
    labels: data.map(item => item.teacher_name),
    datasets: [
      {
        label: 'Average Rating',
        data: data.map(item => item.avg_rating),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Average Final Score',
        data: data.map(item => item.avg_final_score),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const sentimentData = {
    labels: data.map(item => item.teacher_name),
    datasets: [
      {
        label: 'Average Sentiment',
        data: data.map(item => item.avg_sentiment),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Average Cognitive Score',
        data: data.map(item => item.avg_cognitive),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card shadow mb-4">
          <div className="card-header bg-info text-white">
            <h2 className="card-title mb-0">Teaching Analytics Dashboard</h2>
          </div>
          <div className="card-body">
            {data.length === 0 ? (
              <div className="alert alert-info">
                <h4>No data available</h4>
                <p>Submit some feedback to see analytics.</p>
              </div>
            ) : (
              <>
                {/* Charts Section */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Rating vs Final Score</h5>
                      </div>
                      <div className="card-body">
                        <Bar data={chartData} options={{ responsive: true }} />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="card-title">Sentiment & Cognitive Analysis</h5>
                      </div>
                      <div className="card-body">
                        <Line data={sentimentData} options={{ responsive: true }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Section */}
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Teacher</th>
                        <th>Feedback Count</th>
                        <th>Avg Rating</th>
                        <th>Avg Sentiment</th>
                        <th>Avg Cognitive</th>
                        <th>Avg Final Score</th>
                        <th>Score Range</th>
                        <th>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <button
                              className="btn btn-link p-0 fw-bold text-decoration-none"
                              onClick={() => loadTeacherDetails(item.teacher_name)}
                            >
                              {item.teacher_name}
                            </button>
                          </td>
                          <td>
                            <span className="badge bg-secondary">{item.feedback_count}</span>
                          </td>
                          <td>{item.avg_rating} / 5</td>
                          <td>{item.avg_sentiment}</td>
                          <td>{item.avg_cognitive}</td>
                          <td className="fw-bold">{item.avg_final_score}</td>
                          <td>{item.min_score} - {item.max_score}</td>
                          <td>
                            <span className={`badge ${
                              item.avg_final_score > 0.5 ? 'bg-success' :
                              item.avg_final_score > 0.2 ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {item.avg_final_score > 0.5 ? 'Excellent' :
                               item.avg_final_score > 0.2 ? 'Good' : 'Needs Improvement'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Detailed View */}
                {selectedTeacher && (
                  <div className="mt-4">
                    <div className="card">
                      <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Detailed Feedback for {selectedTeacher}</h4>
                        <button
                          className="btn btn-light btn-sm"
                          onClick={() => setSelectedTeacher(null)}
                        >
                          Close
                        </button>
                      </div>
                      <div className="card-body">
                        {teacherDetails.length === 0 ? (
                          <p>No feedback available.</p>
                        ) : (
                          <div className="row">
                            {teacherDetails.map((feedback, index) => (
                              <div key={index} className="col-md-6 mb-3">
                                <div className="card h-100">
                                  <div className="card-body">
                                    <h6 className="card-title">{feedback.student_name}</h6>
                                    <div className="row text-center mb-2">
                                      <div className="col-6">
                                        <small className="text-muted">Rating</small>
                                        <div className="h5 text-primary">{feedback.rating}/5</div>
                                      </div>
                                      <div className="col-6">
                                        <small className="text-muted">CGPA</small>
                                        <div className="h5 text-info">{feedback.cgpa}</div>
                                      </div>
                                    </div>
                                    <div className="row text-center mb-2">
                                      <div className="col-4">
                                        <small className="text-muted">Sentiment</small>
                                        <div className={`h6 ${feedback.sentiment > 0 ? 'text-success' : 'text-danger'}`}>
                                          {feedback.sentiment}
                                        </div>
                                      </div>
                                      <div className="col-4">
                                        <small className="text-muted">Cognitive</small>
                                        <div className="h6 text-warning">{feedback.cognitive_score}</div>
                                      </div>
                                      <div className="col-4">
                                        <small className="text-muted">Final</small>
                                        <div className="h6 text-success fw-bold">{feedback.final_score}</div>
                                      </div>
                                    </div>
                                    <p className="card-text small">
                                      <strong>Comment:</strong> {feedback.comment}
                                    </p>
                                    <button
                                      className="btn btn-sm btn-danger mt-2 d-flex align-items-center gap-1"
                                      onClick={() => deleteFeedbackRecord(feedback.id)}
                                      aria-label="Delete feedback record"
                                    >
                                      <span role="img" aria-hidden="true">🗑️</span>
                                      Delete Record
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;