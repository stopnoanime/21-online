import { Component } from '@angular/core';
import { GameService } from 'src/app/game.service';

@Component({
  selector: 'app-player-actions',
  templateUrl: './player-action.component.html',
  styleUrls: ['./player-action.component.scss'],
})
export class PlayerActionsComponent {
  constructor(public game: GameService) {}
}
