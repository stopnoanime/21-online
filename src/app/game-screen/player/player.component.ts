import { Component, Input, OnInit } from '@angular/core';
import { Card, Hand, Player } from 'backend/src/rooms/schema/GameState';
import { GameService } from 'src/app/game.service';
@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {
  @Input() player?: Player;
  @Input() dealerHand?: Hand;
  @Input() type: 'dealer' | 'player' = 'player';

  get hand() {
    return this.player?.hand || this.dealerHand;
  }

  get isPlayerTurn() {
    return (
      this.player &&
      this.game.room!.state.currentTurnPlayerId == this.player?.sessionId
    );
  }

  get isCurrentPlayer() {
    return this.player && this.game.room!.sessionId == this.player?.sessionId;
  }

  public roundOutcomeToDisplayMessage: { [key: string]: string };

  ngOnInit(): void {
    this.roundOutcomeToDisplayMessage = {
      bust: 'Busted',
      win: this.isCurrentPlayer ? 'You Won!' : 'Win',
      lose: this.isCurrentPlayer ? 'You Lost!' : 'Lose',
      draw: 'Draw',
      '': '',
    };
  }

  constructor(public game: GameService) {}
}
