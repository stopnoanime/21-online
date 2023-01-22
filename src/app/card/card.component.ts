import { Component, HostBinding, Input } from '@angular/core';
import { Card } from 'backend/src/rooms/schema/GameState';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  animations: [
    trigger('enterLeaveAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('400ms', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('400ms', style({ transform: 'translateY(100%)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class CardComponent {
  @HostBinding('@enterLeaveAnimation') enterLeaveAnimation = true;
  @Input() card: Card;
}
