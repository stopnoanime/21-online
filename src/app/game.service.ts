import { Injectable } from '@angular/core';
import { GameState } from 'backend/src/rooms/schema/GameState';
import * as Colyseus from 'colyseus.js';
import { Subject } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  public get room() {
    return this._room;
  }

  public get roundInProgress() {
    return !!this._room && this._room.state.roundState != 'idle';
  }

  public get player() {
    return this._room?.state.players.get(this._room.sessionId);
  }

  public get playersTurn() {
    return (
      !!this._room &&
      this._room.state.currentTurnPlayerId == this._room.sessionId
    );
  }

  private _room?: Colyseus.Room<GameState>;
  private client: Colyseus.Client;
  public kickEvent = new Subject<void>();

  constructor() {
    this.client = new Colyseus.Client(environment.gameServer);
  }

  public async createRoom() {
    this.updateRoom(await this.client.create('gameRoom'));
  }

  public async joinRoom(id: string) {
    this.updateRoom(await this.client.joinById(id));
  }

  public setReadyState(newState: boolean) {
    this.room?.send('ready', newState);
  }

  public setBet(newBet: number) {
    this.room?.send('bet', newBet);
  }

  public hit() {
    this.room?.send('hit');
  }

  public stay() {
    this.room?.send('stay');
  }

  private updateRoom(room: Colyseus.Room<GameState>) {
    this._room = room;
    this._room.onLeave((code) => {
      this._room = undefined;

      //Send kicked event
      if (code == 4000) this.kickEvent.next();
    });
  }
}
