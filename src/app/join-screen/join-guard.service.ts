import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { GameService } from '../game.service';

@Injectable({
  providedIn: 'root',
})
export class JoinGuardService {
  constructor(private game: GameService) {}

  async canActivate(route: ActivatedRouteSnapshot) {
    //Connected to a room, disconnect from it
    if (this.game.room) {
      this.game.room.leave(false);
    }

    return true;
  }
}
