import { Component, Input } from '@angular/core';
import { GameState, Player } from 'backend/src/rooms/schema/GameState';
import { Room } from 'colyseus.js';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.scss'],
})
export class GameScreenComponent {
  @Input() room: Room<GameState>;

  private rotateArray<Type>(a: Type[], n: number) {
    return a.concat(a.splice(0, n));
  }

  public getAllPlayers() {
    //Get all players
    let players: (Player | undefined)[] = [...this.room.state.players.values()];

    //Find index of player
    const playerIndex = players.findIndex(
      (p) => p?.sessionId == this.room.sessionId
    );

    //Rotate array so it starts at player
    players = this.rotateArray(players, playerIndex);

    //Fill array with undefined up to length of 7
    const initialLength = players.length;
    for (let i = initialLength; i < 7; i++) {
      players.splice(
        initialLength - Math.ceil(initialLength / 2) + 1,
        0,
        undefined
      );
    }

    //Make player index equal 3 to position it at bottom of table
    players = this.rotateArray(players, 4);

    return players;
  }
}
