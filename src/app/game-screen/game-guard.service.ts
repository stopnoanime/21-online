import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { GameService } from '../game.service';

@Injectable({
  providedIn: 'root',
})
export class GameGuardService implements CanActivate {
  constructor(private game: GameService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot) {
    if (this.game.room) return true;

    //Not connected to any room, try to reconnect
    const roomId = route.paramMap.get('id')!;
    const sessionId = route.queryParamMap.get('session')!;
    const reconnected = await this.game.reconnectRoom(roomId, sessionId);

    if (reconnected) return true;

    //Was not able to reconnect, return to main page
    this.router.navigateByUrl('');
    return false;
  }
}
