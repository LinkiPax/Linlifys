// TestFileAccess.jsx
import { useEffect } from "react";

export default function TestFileAccess() {
  useEffect(() => {
    // Test multiple possible paths
    const paths = [
      "/treeweb.glb",
      "/realistic_trees_collection.glb",
      "./treeweb.glb",
      "./public/treeweb.glb",
      "treeweb.glb"
    ];
    
    paths.forEach(path => {
      fetch(path)
        .then(response => {
          console.log(`Path: ${path}`);
          console.log(`Status: ${response.status}`);
          console.log(`Type: ${response.headers.get('content-type')}`);
          console.log('---');
        })
        .catch(err => {
          console.log(`Path: ${path} - ERROR:`, err.message);
        });
    });
  }, []);

  return <div>Checking file access... (see console)</div>;
}