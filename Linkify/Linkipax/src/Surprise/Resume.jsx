import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ResumeAnalyzer.css"; // Custom styling

const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null); 
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const userId = localStorage.getItem("userId");

  // Handle file upload
  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      // Validate file type
      const validFileTypes = [".pdf", ".doc", ".docx"];
      const fileType = uploadedFile.name.split(".").pop();
      if (!validFileTypes.includes(`.${fileType.toLowerCase()}`)) {
        setError("Invalid file type. Please upload a PDF, DOC, or DOCX file."); 
        setFile(null); // Reset file selection
      } else {
        setError("");
        setFile(uploadedFile);
      }
    }
  };

  // Handle analysis button click
  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError("");
    setResults(null); // Reset previous results

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    formData.append("userId", userId);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response.data.analysisResult);
      setResults(response.data.analysisResult); // Display analysis result
      console.log(results); 
      setIsAnalyzing(false);
    } catch (err) {
      console.error("Error uploading or analyzing resume:", err);
      setError("Failed to analyze the resume. Please try again later.");
      setIsAnalyzing(false);
    }
  };

  // Handle Clear Button Click
  const clearForm = () => {
    setFile(null);
    setJobDescription("");
    setError("");
    setResults(null);
  };

  return (
    <div className="container mt-0 resume-analyzer">
      <h1 className="text-center title">Resume Analyzer</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mt-4 upload-section">
        <label htmlFor="resume-upload" className="form-label">Upload Your Resume</label>
        <input
          type="file"
          id="resume-upload"
          className="form-control file-input"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />
        {file && <p className="mt-2 file-name">Selected File: {file.name}</p>}
      </div>

      <div className="mt-4 job-description-section">
        <label htmlFor="job-description" className="form-label">Paste Job Description (Optional)</label>
        <textarea
          id="job-description"
          className="form-control job-description-textarea"
          rows="4"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        ></textarea>
      </div>

      <div className="mt-4 text-center">
        <button
          className="btn analyze-button"
          onClick={analyzeResume}
          disabled={!file || isAnalyzing}
        >
          {isAnalyzing ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : "Analyze Resume"}
        </button>
        <button
          className="btn btn-secondary ml-3"
          onClick={clearForm}
          disabled={isAnalyzing}
        >
          Clear
        </button>
      </div>

      <div className="mt-5 results-section">
        <h3 className="results-title">Analysis Results</h3>
        {results ? (
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="card-title">ATS Score</h5>
                </div>
                <div className="card-body">
                  <p className="card-text">{results.atsScore}</p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="card-title">Match Percentage</h5>
                </div>
                <div className="card-body">
                  <p className="card-text">{results.matchPercentage}%</p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="card-title">Skills Match</h5>
                </div>
                <div className="card-body">
                  {Object.keys(results.skillsMatch).map((category) => (
                    <div key={category}>
                      <strong>{category}</strong>
                      <ul>
                        {results.skillsMatch[category].length > 0 ? (
                          results.skillsMatch[category].map((skill, index) => (
                            <li key={index}>{skill}</li>
                          ))
                        ) : (
                          <li>No skills matched</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="card-title">Recommendations</h5>
                </div>
                <div className="card-body">
                  {results.recommendations.length > 0 ? (
                    <ul>
                      {results.recommendations.map((recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No recommendations available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="results-placeholder">Upload a resume to see analysis results here.</p>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
