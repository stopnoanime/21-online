import { Component, Input } from '@angular/core';
import { GameState, Player } from 'backend/src/rooms/schema/GameState';
import { Room } from 'colyseus.js';
import { GameService } from '../game.service';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.scss'],
})
export class GameScreenComponent {
  @Input() room: Room<GameState>;

  public trackByPlayerId(index: number, obj: [string, Player]) {
    return obj[1].sessionId;
  }
}
