import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-player-action',
  templateUrl: './player-action.component.html',
  styleUrls: ['./player-action.component.scss'],
})
export class PlayerActionComponent {
  @Input() roundInProgress: boolean;
  @Input() playersTurn: boolean;

  @Input() ready: boolean;
  @Output() readyChange = new EventEmitter<boolean>();

  @Input() bet: number;
  @Output() betChange = new EventEmitter<number>();

  @Output() hit = new EventEmitter<void>();
  @Output() stay = new EventEmitter<void>();
}
