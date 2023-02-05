import { Component, Input, OnInit } from '@angular/core';
import { Card, Hand, Player } from 'backend/src/rooms/schema/GameState';
import { GameService } from 'src/app/game.service';
@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  @Input() player?: Player;
  @Input() dealerHand?: Hand;
  @Input() type: 'dealer' | 'player' = 'player';

  get hand() {
    return this.player?.hand || this.dealerHand;
  }

  get isPlayerTurn() {
    return this.game.room!.state.currentTurnPlayerId == this.player?.sessionId;
  }

  //'bust' | 'win' | 'lose' | 'draw' | '';
  public roundOutcomeToDisplayMessage = {
    bust: 'Busted',
    win: 'You Won',
    lose: ' You lost',
    draw: 'Draw',
    '': '',
  };

  constructor(public game: GameService) {}
}
