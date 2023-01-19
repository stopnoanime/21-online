import { Injectable } from '@angular/core';
import * as Colyseus from 'colyseus.js';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  client: Colyseus.Client;

  constructor() {
    this.client = new Colyseus.Client(environment.gameServer);
  }

  public joinRoom(roomName: string) {
    this.client
      .joinOrCreate('my_room')
      .then((room) => {
        console.log(room.sessionId, 'joined', room.name);
      })
      .catch((e) => {
        console.log('JOIN ERROR', e);
      });
  }
}
