import { Injectable } from '@angular/core';
import { GameState } from 'backend/src/rooms/schema/GameState';
import * as Colyseus from 'colyseus.js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  client: Colyseus.Client;
  room?: Colyseus.Room<GameState>;
  stateChange = new BehaviorSubject<GameState | undefined>(undefined);

  constructor() {
    this.client = new Colyseus.Client(environment.gameServer);
  }

  public async createRoom() {
    this.room = await this.client.create('gameRoom');
    this.room.onStateChange((s) => this.stateChange.next(s));
  }

  public async joinRoom(id: string) {
    this.room = await this.client.joinById(id);
    this.room.onStateChange((s) => this.stateChange.next(s));
  }
}
