import React, { useState } from "react";
import {
  Button,
  Container,
  FormControlLabel,
  Grid,
  Input,
  InputLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@material-ui/core";
import request from "./utils";
import ReactJson from 'react-json-view'
import { useHistory } from "react-router-dom";

function First(props) {
  const [name, setName] = useState("");
  const [pwd, setPwd] = useState("");
  const [method, setMethod] = useState("login");
  const [error,setError] = useState(false);
  const [errorMessage,setErrorMessage] = useState('')

  let history =  useHistory();

  const handleSubmit = (e) => {
    e.preventDefault();
    history.push('/socket')

    request("/socket", "POST", { name: name, pwd: pwd, process: method }).then(
      (res) => {
        if ((res.status != "200")) {
            setError(true);
            
        }
        if(res.status== 200){
            history.push('/socket')
        }
        return res;
      }
    )
    .then(r=>r.json())
    .then(r=>{setErrorMessage(r.errors);setError(true)})
  };

  return (
    <Container
      maxWidth="sm"
      style={{
        paddingTop: "1vh",
        paddingBottom: "2vh",
        border: "1px solid black",
        display: "flex",
        justifyContent: "center",
        alignItem: "center",
      }}
    >{
        error?<ReactJson src={errorMessage} /> :<> 
      <form
        onSubmit={(e) => {
          handleSubmit(e);
        }}
      >
        <Container>
          <Grid>
            <Grid item>
              <TextField
                type="text"
                variant="outlined"
                placeholder="Name"
                style={{ paddingTop: "1vh" }}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </Grid>
            <Grid item>
              <TextField
                type="password"
                variant="outlined"
                placeholder="Password"
                style={{ paddingTop: "1vh" }}
                value={pwd}
                onChange={(e) => {
                  setPwd(e.target.value);
                }}
              />
            </Grid>
            <Grid item>
              <RadioGroup
                name="process"
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  console.log(e.target.value);
                }}
                style={{ paddingTop: "1vh" }}
                row
              >
                <FormControlLabel
                  value="login"
                  control={<Radio />}
                  label="Login"
                />
                <FormControlLabel
                  value="signup"
                  control={<Radio />}
                  label="SignUp"
                />
              </RadioGroup>
            </Grid>
            <Grid item style={{ paddingTop: "1vh" }}>
              <Button type="submit" variant="contained">
                Submit
              </Button>
            </Grid>
          </Grid>
        </Container>
      </form>
      </>
    }
    </Container>
  );
}

export default First;
