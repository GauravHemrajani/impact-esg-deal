import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { Client } from "boardgame.io/react";
import { SocketIO } from 'boardgame.io/multiplayer';
import { ImpactGame } from "./Game";
import { Board } from "./Board";

const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000';

const GameClient = Client({
  game: ImpactGame,
  board: Board,
  debug: true,
  // multiplayer: SocketIO({ server: serverURL }),
});

export default function App() {
  async function testFirebase() {
    try {
      const docRef = await addDoc(collection(db, "test"), {
        message: "Firebase connected!",
        time: new Date(),
        testNumber: Math.random()
      });
      alert("✅ SUCCESS! Firebase is working!\n\nDocument ID: " + docRef.id + "\n\nCheck your Firebase Console to see the data!");
      console.log("Document written with ID: ", docRef.id);
    } catch (error) {
      alert("❌ ERROR: " + error.message);
      console.error("Error adding document: ", error);
    }
  }

  return (
    <div>
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        zIndex: 9999,
        background: '#fff',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        <button 
          onClick={testFirebase}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          🔥 Test Firebase
        </button>
      </div>
      <GameClient/>
    </div>
  );
}