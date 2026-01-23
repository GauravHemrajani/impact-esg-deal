import { useState } from "react";
import { Client } from "boardgame.io/react";
import { SocketIO } from 'boardgame.io/multiplayer';
import { ImpactGame } from "./Game";
import { Board } from "./Board";
import { LobbyLanding } from "./LobbyLanding";
import { WaitingRoom } from "./WaitingRoom";

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
    inWaitingRoom: false,
    inGame: false,
    matchID: null,
    playerID: null,
    playerName: null,
    credentials: null,
  });

  const handleJoinGame = (gameInfo) => {
    setGameState({
      inLobby: false,
      inWaitingRoom: true,
      inGame: false,
      ...gameInfo,
    });
  };

  const handleStartGame = () => {
    setGameState(prev => ({
      ...prev,
      inWaitingRoom: false,
      inGame: true,
    }));
  };

  const handleLeaveLobby = () => {
    setGameState({
      inLobby: true,
      inWaitingRoom: false,
      inGame: false,
      matchID: null,
      playerID: null,
      playerName: null,
      credentials: null,
    });
  };

  // Show landing page
  if (gameState.inLobby) {
    return <LobbyLanding onJoinGame={handleJoinGame} />;
  }

  // Show waiting room
  if (gameState.inWaitingRoom) {
    return (
      <WaitingRoom 
        matchID={gameState.matchID}
        playerID={gameState.playerID}
        playerName={gameState.playerName}
        onStartGame={handleStartGame}
        onLeave={handleLeaveLobby}
      />
    );
  }

  // Show game
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