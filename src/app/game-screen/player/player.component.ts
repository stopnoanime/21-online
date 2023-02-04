import { Component, Input } from '@angular/core';
import { Card, Hand, Player } from 'backend/src/rooms/schema/GameState';
import { GameService } from 'src/app/game.service';
@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent {
  @Input() player?: Player;
  @Input() hand?: Hand;

  @Input() type: 'dealer' | 'player' = 'player';

  get cards() {
    return this.player?.hand.cards || this.hand?.cards!;
  }

  get cardsValue() {
    return this.player?.hand.score || this.hand?.score;
  }

  get busted() {
    return this.cardsValue! > 21;
  }

  get isBlackjack() {
    return this.player?.hand.isBlackjack || this.hand?.isBlackjack;
  }

  get isPlayerTurn() {
    return this.game.room!.state.currentTurnPlayerId == this.player?.sessionId;
  }

  constructor(public game: GameService) {}
}
