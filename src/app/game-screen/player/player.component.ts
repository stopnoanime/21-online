import { Component, Input } from '@angular/core';
import { Player } from 'backend/src/rooms/schema/GameState';
import { GameService } from 'src/app/game.service';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  @Input() player?: Player;

  constructor(public game: GameService) {}
}
