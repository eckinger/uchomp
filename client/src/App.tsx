import "./App.css";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ViewGroups from "./pages/viewGroups";
import CreateGroup from "./pages/createGroup";
import RecordInfo from "./pages/recordInfo";
import User from "./models/user";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/groups" replace />} />
      <Route path="/groups" element={<Navigate to="/groups/view" replace />} />
      <Route path="/groups/view" element={<ViewGroups />} />
      <Route path="/groups/create" element={<CreateGroup />} />
      <Route path="/groups/records" element={<RecordInfo />} />
    </Routes>
  );
}

export default App;
