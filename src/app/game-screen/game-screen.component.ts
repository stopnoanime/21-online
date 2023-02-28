import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, Input } from '@angular/core';
import gameConfig from 'backend/src/game.config';
import { map, Observable } from 'rxjs';
import { GameService } from '../game.service';
import { placePlayersAtTable } from './placePlayersAtTable';

@Component({
  selector: 'app-game-screen',
  templateUrl: './game-screen.component.html',
  styleUrls: ['./game-screen.component.scss'],
})
export class GameScreenComponent {
  location = location;
  Math = Math;

  smallScreen$: Observable<boolean>;

  constructor(public game: GameService, public breakpoint: BreakpointObserver) {
    this.smallScreen$ = breakpoint
      .observe('(max-width: 639px)')
      .pipe(map((x) => !!x.matches));
  }

  getPlayerPosition(index: number) {
    return Math.abs(0.5 - (index + 1) / (gameConfig.maxClients + 1));
  }

  getAllPlayers() {
    return placePlayersAtTable(
      [...this.game.room!.state.players.values()],
      this.game.room!.sessionId,
      gameConfig.maxClients
    );
  }
}
