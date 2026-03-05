import { useEffect, useState } from 'react'
import GameLauncher from './GameLauncher.tsx';

function App() {
  // // 1. Create a state to store the message from the server
  // const [serverMessage, setServerMessage] = useState("Connecting to server...")

  // const savePlayer = async () => {
  //   const response = await fetch('http://localhost:5000/api/create-player', { method: 'POST' });
  //   const data = await response.json();
  //   alert(data.message);
  // };

  // useEffect(() => {
  //   // 2. Call the status endpoint we created on port 5000
  //   fetch('http://localhost:5000/api/status')
  //     .then((res) => res.json())
  //     .then((data) => {
  //       // 3. Update the state with the server's response
  //       setServerMessage(data.message);
  //     })
  //     .catch((err) => {
  //       setServerMessage("Server is offline. Did you start it?");
  //       console.error("Fetch error:", err);
  //     });
  // }, []); // The empty array [] means this runs only once on load

  // return (
  //   <div style={{ padding: '20px', textAlign: 'center' }}>
  //     <h1>My MERN Game</h1>
  //     <p>Status: <strong>{serverMessage}</strong></p>
  //     <button onClick={savePlayer}>Save Player</button>
  //   </div>
  // )

  return GameLauncher
}

export default App