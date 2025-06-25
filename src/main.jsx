import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // ກວດສອບວ່າໄຟລ໌ App.jsx ມີຢູ່ໃນໂຟນເດີ src/
import "./index.css"; // ກວດສອບວ່າໄຟລ໌ index.css ມີຢູ່ໃນໂຟນເດີ src/

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
