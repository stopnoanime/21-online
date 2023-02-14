import { Player } from 'backend/src/rooms/schema/GameState';

function rotateArray<Type>(a: Type[], n: number) {
  return a.concat(a.splice(0, n));
}

export function sortPlayers(
  players: (Player | undefined)[],
  playerId: string,
  maxPlayers: number
) {
  //Find index of player
  const playerIndex = players.findIndex((p) => p?.sessionId == playerId);

  //Rotate array so it starts at player
  players = rotateArray(players, playerIndex);

  //Fill array with undefined up to length of maxPlayers
  const initialLength = players.length;
  players.splice(
    initialLength - Math.ceil(initialLength / 2) + 1,
    0,
    ...new Array(maxPlayers - initialLength)
  );

  //Position player at bottom of table
  players = rotateArray(players, (maxPlayers + 1) / 2);

  return players;
}
