import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { Client } from "boardgame.io/react";
import { SocketIO } from 'boardgame.io/multiplayer';
import { ImpactGame } from "./Game";
import { Board } from "./Board";
import { LobbyLanding } from "./LobbyLanding";

const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000';

const GameClient = Client({
  game: ImpactGame,
  board: Board,
  debug: true,
  multiplayer: SocketIO({ server: serverURL }),
});

export default function App() {
  const [gameState, setGameState] = useState({
    inLobby: true,
    matchID: null,
    playerID: null,
    playerName: null,
    credentials: null,
  });

  const handleJoinGame = (gameInfo) => {
    setGameState({
      inLobby: false,
      ...gameInfo,
    });
  };

  // Show landing page if in lobby
  if (gameState.inLobby) {
    return <LobbyLanding onJoinGame={handleJoinGame} />;
  }

  // Show game once player joins
  return (
    <div>
      <GameClient 
        matchID={gameState.matchID}
        playerID={gameState.playerID}
        credentials={gameState.credentials}
      />
    </div>
  );
}