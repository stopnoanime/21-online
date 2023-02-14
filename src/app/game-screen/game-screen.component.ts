import { Component, Input } from '@angular/core';
import gameConfig from 'backend/src/game.config';
import { GameState, Player } from 'backend/src/rooms/schema/GameState';
import { Room } from 'colyseus.js';
import { sortPlayers } from './sortPlayers';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.scss'],
})
export class GameScreenComponent {
  @Input() room: Room<GameState>;

  getAllPlayers() {
    return sortPlayers(
      [...this.room.state.players.values()],
      this.room.sessionId,
      gameConfig.maxClients
    );
  }
}
