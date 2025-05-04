import "./App.css";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Groups from "./pages/groups/page";
import CreateGroup from "./pages/create-group/page";
import User from "./models/user";

function App() {
  return (
    <Routes>
      <Route path="/groups" element={<Groups />} />
      <Route path="/create-group" element={<CreateGroup user={new User()} />} />
      <Route path="*" element={<Navigate to="/groups" replace />} />
    </Routes>
  );
}

export default App;
