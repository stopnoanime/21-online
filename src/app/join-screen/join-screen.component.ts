import { Component } from '@angular/core';
import { GameService } from '../game.service';

@Component({
  selector: 'app-join-screen',
  templateUrl: './join-screen.component.html',
  styleUrls: ['./join-screen.component.scss'],
})
export class JoinScreenComponent {
  constructor(public game: GameService) {}
}
