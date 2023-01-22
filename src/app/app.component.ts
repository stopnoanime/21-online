import { Component } from '@angular/core';
import { Player } from 'backend/src/rooms/schema/GameState';
import { GameService } from './game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(public game: GameService) {}

  public trackByPlayerId(index: number, obj: [string, Player]) {
    return obj[1].sessionId;
  }
}
