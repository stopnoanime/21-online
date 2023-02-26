import { Component, Input } from '@angular/core';
import { Hand } from 'backend/src/rooms/schema/GameState';

@Component({
  selector: 'app-hand-score',
  templateUrl: './hand-score.component.html',
  styleUrls: ['./hand-score.component.scss'],
})
export class HandScoreComponent {
  @Input() hand?: Hand;
}
