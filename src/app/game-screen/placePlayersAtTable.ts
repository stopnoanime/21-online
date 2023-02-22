import { Player } from 'backend/src/rooms/schema/GameState';

function rotateArray<Type>(a: Type[], n: number) {
  return a.concat(a.splice(0, n));
}

/**
 * Given an array of players, positions them so player with playerId is in middle of it, and empty space is filled with undefined
 * @param players Array of players
 * @param playerId Id of current player (the player that will be positioned at middle of table)
 * @param tableSize Table size
 * @returns The properly positioned players
 */
export function placePlayersAtTable(
  players: (Player | undefined)[],
  playerId: string,
  tableSize: number
) {
  //Find index of player
  const playerIndex = players.findIndex((p) => p?.sessionId == playerId);

  //Rotate array so it starts at player
  players = rotateArray(players, playerIndex);

  //Fill array with undefined up to tableSize
  const initialLength = players.length;
  players.splice(
    initialLength - Math.ceil(initialLength / 2) + 1,
    0,
    ...new Array(tableSize - initialLength)
  );

  //Position player at bottom of table
  players = rotateArray(players, (tableSize + 1) / 2);

  return players;
}