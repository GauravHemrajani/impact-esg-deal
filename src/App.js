import { Client } from "boardgame.io/react";
import { ImpactGame } from "./Game";
import { Board } from "./Board";

const GameClient = Client({
  game: ImpactGame,
  board: Board,
  debug: true,
});

export default function App() {
  return <GameClient/>;
}