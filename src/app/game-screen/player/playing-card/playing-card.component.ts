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
  templateUrl: './playing-card.component.html',
  styleUrls: ['./playing-card.component.scss'],
  animations: [
    trigger('enterLeaveAnimation', [
      transition(':enter', [
        style({
          transform:
            'translate(var(--card-translation-x),var(--card-translation-y))',
          opacity: 0,
        }),
        group([
          query('@hiddenVisible', animateChild()),
          animate('500ms', style({ transform: 'translate(0,0)', opacity: 1 })),
        ]),
      ]),
      transition(':leave', [
        group([
          query('@hiddenVisible', animateChild()),
          animate(
            '500ms',
            style({
              transform:
                'translate(var(--card-translation-x),var(--card-translation-y))',
              opacity: 0,
            })
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
export class PlayingCardComponent {
  @HostBinding('@enterLeaveAnimation') enterLeaveAnimation = true;
  @Input() card: Card;
}
