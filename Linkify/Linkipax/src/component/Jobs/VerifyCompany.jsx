import React, { useState } from "react";
import "./VerifyCompany.css";

export default function VerifyCompany() {
  const [email, setEmail] = useState("");

  return (
    <div className="verify-page">
      <h2>Verify Your Company</h2>
      <input
        type="email"
        placeholder="Company Email (e.g., @yourcompany.com)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button>Send Verification Link</button>
      <p>We’ll send a confirmation to your email.</p>
    </div>
  );
}
