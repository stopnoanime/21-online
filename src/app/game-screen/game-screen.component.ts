import { Component, Input } from '@angular/core';
import gameConfig from 'backend/src/game.config';
import { GameService } from '../game.service';
import { placePlayersAtTable } from './placePlayersAtTable';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.scss'],
})
export class GameScreenComponent {
  location = location;
  Math = Math;

  constructor(public game: GameService) {}

  getAllPlayers() {
    return placePlayersAtTable(
      [...this.game.room!.state.players.values()],
      this.game.room!.sessionId,
      gameConfig.maxClients
    );
  }
}
