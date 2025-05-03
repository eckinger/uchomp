import logo from "./logo.svg";
import "./App.css";
import UserService from "./services/userService";
import React from "react";

function App() {
  const userService = new UserService();

  const databaseFetch = () => {
    fetch("http://localhost:5151/api/users")
      .then((res) => res.json())
      .then((data) => console.log(`data: ${JSON.stringify(data)}`));
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a onClick={() => databaseFetch()} className="App-link">
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
