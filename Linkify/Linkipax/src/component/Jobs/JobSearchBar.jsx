import React, { useState } from "react";
import "./JobSearchBar.css";

export default function JobSearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search jobs (e.g., 'React', 'Remote')"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button>🔍</button>
    </div>
  );
}
