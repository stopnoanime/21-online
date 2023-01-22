import { Component, HostBinding, Input } from '@angular/core';
import { Card } from 'backend/src/rooms/schema/GameState';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  group,
  query,
  animateChild,
} from '@angular/animations';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  animations: [
    trigger('enterLeaveAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        group([
          query('@hiddenVisible', animateChild()),
          animate('400ms', style({ transform: 'translateY(0)', opacity: 1 })),
        ]),
      ]),
      transition(':leave', [
        group([
          query('@hiddenVisible', animateChild()),
          animate(
            '400ms',
            style({ transform: 'translateY(100%)', opacity: 0 })
          ),
        ]),
      ]),
    ]),
    trigger('hiddenVisible', [
      state(
        'true',
        style({
          transform: 'rotateY(180deg)',
        })
      ),
      state(
        'false',
        style({
          transform: 'rotateY(0deg)',
        })
      ),
      transition('* => *', [animate('700ms')]),
    ]),
  ],
})
export class CardComponent {
  @HostBinding('@enterLeaveAnimation') enterLeaveAnimation = true;
  @Input() card: Card;
}
