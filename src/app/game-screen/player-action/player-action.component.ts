import { Component } from '@angular/core';
import { GameService } from 'src/app/game.service';
import gameConfig from 'backend/src/game.config';

@Component({
  selector: 'app-player-actions',
  templateUrl: './player-action.component.html',
  styleUrls: ['./player-action.component.scss'],
})
export class PlayerActionsComponent {
  gameConfig = gameConfig;

  constructor(public game: GameService) {}
}
