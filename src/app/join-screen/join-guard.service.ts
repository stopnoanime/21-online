import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { GameService } from '../game.service';

@Injectable({
  providedIn: 'root',
})
export class JoinGuardService {
  constructor(private game: GameService) {}

  async canActivate(route: ActivatedRouteSnapshot) {
    //Try to reconnect to saved room on first load
    if (!this.game.connectedBefore) {
      const reconnected = await this.game.reconnectSavedRoom();

      //Only go to join screen if was not able to reconnect
      return !reconnected;
    }

    //Connected to a room, disconnect from it
    if (this.game.room) this.game.room.leave(false);

    return true;
  }
}
