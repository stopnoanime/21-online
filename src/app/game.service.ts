import { Injectable } from '@angular/core';
import gameConfig from 'backend/src/game.config';
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
    this.reconnectRoom();
  }

  public async createRoom() {
    this.updateRoom(await this.client.create('gameRoom'));
  }

  public async joinRoom(id: string) {
    this.updateRoom(await this.client.joinById(id.toUpperCase()));
  }

  public async reconnectRoom() {
    const previousRoomData = this.getRoomData();

    if (!previousRoomData) return;

    try {
      this.updateRoom(
        await this.client.reconnect(
          previousRoomData.roomId,
          previousRoomData.sessionId
        )
      );
    } catch {
      //Previous room data is invalid, clear it
      this.clearRoomData();
    }
  }

  public setReadyState(newState: boolean) {
    this.room?.send('ready', newState);
  }

  public setBet(newBet: number) {
    if (!newBet) return;
    this.room?.send('bet', newBet);
  }

  public hit() {
    this.room?.send('hit');
  }

  public stay() {
    this.room?.send('stay');
  }

  public kick(id: string) {
    this.room?.send('kick', id);
  }

  private updateRoom(room: Colyseus.Room<GameState>) {
    this._room = room;

    this.saveRoomData(room);
    this._room.onLeave((code) => {
      this._room = undefined;

      if (code == gameConfig.kickCode) this.kickEvent.next();
    });
  }

  private saveRoomData(room: Colyseus.Room<GameState>) {
    localStorage.setItem('roomId', room.id);
    localStorage.setItem('sessionId', room.sessionId);
  }

  private getRoomData() {
    const roomId = localStorage.getItem('roomId');
    const sessionId = localStorage.getItem('sessionId');

    if (roomId && sessionId) return { roomId: roomId, sessionId: sessionId };

    return null;
  }

  private clearRoomData() {
    localStorage.removeItem('roomId');
    localStorage.removeItem('sessionId');
  }
}
