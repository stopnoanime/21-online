import { Component, EventEmitter, Input, Output } from '@angular/core';
import gameConfig from 'backend/src/game.config';

@Component({
  selector: 'app-player-actions',
  templateUrl: './player-action.component.html',
  styleUrls: ['./player-action.component.scss'],
})
export class PlayerActionsComponent {
  @Input() betMenuDisabled? = false;
  @Input() currentBet = 0;
  @Output() changeBet = new EventEmitter<number>();
  @Output() setBet = new EventEmitter<number>();

  /** If true stayHitMenu is shown instead of ready menu */
  @Input() readyMenuHidden = false;
  @Input() ready? = false;
  @Output() readyChange = new EventEmitter<boolean>();
  @Input() autoReady? = false;
  @Output() autoReadyChange = new EventEmitter<boolean>();

  @Input() stayHitMenuDisabled = false;
  @Output() stay = new EventEmitter();
  @Output() hit = new EventEmitter();

  gameConfig = gameConfig;
}
