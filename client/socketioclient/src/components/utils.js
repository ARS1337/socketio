const serverUrl = "http://localhost:3001";

const headers = {
  "Content-Type": "application/json",
};

const request = async (url, type, body={}) => {
  let response;
    response = await fetch(`${serverUrl}${url}`, {
      method: type,
      headers: headers,
      body:JSON.stringify(body),
    });

  return response;
};

export default request;