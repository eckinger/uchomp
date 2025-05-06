import "./App.css";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ViewGroups from "./pages/viewGroups";
import CreateGroup from "./pages/createGroup";
import RecordInfo from "./pages/recordInfo";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/view" replace />} />
      <Route path="/view" element={<ViewGroups />} />
      <Route path="/create" element={<CreateGroup />} />
      <Route path="/records" element={<RecordInfo />} />
    </Routes>
  );
}

export default App;
