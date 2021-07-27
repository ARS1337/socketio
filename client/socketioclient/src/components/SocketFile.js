import React from 'react';
import { io } from "socket.io-client";
// const socket = io('http://localhost:3001');

function SocketFile(props) {
    const socket = io();

    console.log(socket)
    return (
        <div>
            
        </div>
    );
}

export default SocketFile;