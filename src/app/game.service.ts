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
    this.stateChange.subscribe(console.log);
  }

  public async createRoom() {
    this.updateRoom(await this.client.create('gameRoom'));
  }

  public async joinRoom(id: string) {
    this.updateRoom(await this.client.joinById(id));
  }

  public sendMove() {
    this.room?.send('move');
  }

  public changeReadyState() {
    this.room?.send(
      'ready',
      !this.room.state.players.get(this.room.sessionId)?.ready
    );
  }

  private updateRoom(room: Colyseus.Room<GameState>) {
    this.room = room;
    this.room.onStateChange((s) => this.stateChange.next(s));
    this.room.onLeave((_) => (this.room = undefined));
  }
}
