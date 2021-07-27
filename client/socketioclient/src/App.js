import logo from "./logo.svg";
import "./App.css";
import { useEffect } from "react";
import First from "./components/First";
import { Route, Switch, BrowserRouter as Router } from "react-router-dom";
import SocketFile from "./components/SocketFile";

function App() {
  return (
    <>
      <Router>
          <Route path="/" exact component={First} />
          <Route path="/socket" exact component={SocketFile} />
      </Router>
    </>
  );
}

const Dataa = () =>{
  return <>
  first
  </>
}

export default App;
