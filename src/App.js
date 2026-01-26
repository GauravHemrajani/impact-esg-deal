import { useState } from "react";
import { Client } from "boardgame.io/react";
import { SocketIO } from 'boardgame.io/multiplayer';
import { ImpactGame } from "./Game";
import { Board } from "./Board";
import { LobbyLanding } from "./LobbyLanding";
import { WaitingRoom } from "./WaitingRoom";
import { GameOverScreen } from "./GameOverScreen";

const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000';

export default function App() {
  const [gameState, setGameState] = useState({
    inLobby: true,
    inWaitingRoom: false,
    inGame: false,
    inGameOver: false,
    matchID: null,
    playerID: null,
    playerName: null,
    player0Name: null,
    player1Name: null,
    winner: null,
  });

  const handleJoinGame = (gameInfo) => {
    setGameState({
      inLobby: false,
      inWaitingRoom: true,
      inGame: false,
      inGameOver: false,
      ...gameInfo,
    });
  };

  const handleStartGame = (player0Name, player1Name, newMatchID) => {
    setGameState(prev => ({
      ...prev,
      inWaitingRoom: false,
      inGame: true,
      inGameOver: false,
      player0Name,
      player1Name,
      matchID: newMatchID || prev.matchID, // Update matchID if provided
    }));
  };

  const handleGameOver = (winner) => {
    setGameState(prev => ({
      ...prev,
      inGame: false,
      inGameOver: true,
      winner,
    }));
  };

  const handlePlayAgain = () => {
    setGameState(prev => ({
      ...prev,
      inGameOver: false,
      inWaitingRoom: true,
      winner: null,
    }));
  };

  const handleLeaveLobby = () => {
    setGameState({
      inLobby: true,
      inWaitingRoom: false,
      inGame: false,
      inGameOver: false,
      matchID: null,
      playerID: null,
      playerName: null,
      player0Name: null,
      player1Name: null,
      winner: null,
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

  // Show game over screen
  if (gameState.inGameOver) {
    return (
      <GameOverScreen
        winner={gameState.winner}
        matchID={gameState.matchID}
        playerID={gameState.playerID}
        player0Name={gameState.player0Name}
        player1Name={gameState.player1Name}
        onPlayAgain={handlePlayAgain}
        onExit={handleLeaveLobby}
      />
    );
  }

  // Show game - create GameClient dynamically with onGameOver prop
  const GameClient = Client({
    game: ImpactGame,
    board: Board,
    debug: true,
    multiplayer: SocketIO({ server: serverURL }),
  });

  return (
    <div>
      <GameClient 
        matchID={gameState.matchID}
        playerID={gameState.playerID}
        onGameOver={handleGameOver}
        playerName={gameState.playerName}
      />
    </div>
  );
}