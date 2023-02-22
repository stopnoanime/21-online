import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(private router: Router) {
    this.client = new Colyseus.Client(environment.gameServer);
  }

  public async createRoom() {
    return await this.updateRoom(this.client.create('gameRoom'));
  }

  public async joinRoom(id: string) {
    return await this.updateRoom(this.client.joinById(id.toUpperCase()));
  }

  public async reconnectRoom(roomId?: string, sessionId?: string) {
    if (!roomId) return false;

    //Try to reconnect
    if (sessionId) {
      const connected = await this.updateRoom(
        this.client.reconnect(roomId, sessionId)
      );

      if (connected) return true;
    }

    //Reconnecting was not successful, try to connect, and return if it was successful
    return await this.joinRoom(roomId);
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

  private async updateRoom(room: Promise<Colyseus.Room<GameState>>) {
    try {
      this._room = await room;
    } catch (error) {
      //Was not able to connect
      console.log(error);
      return false;
    }

    this._room.onLeave((code) => {
      this._room = undefined;

      if (code == gameConfig.kickCode) this.kickEvent.next();

      this.router.navigateByUrl(``);
    });

    this.router.navigate([`room/${this._room.id}`], {
      queryParams: { session: this._room.sessionId },
    });

    // Connected
    return true;
  }
}
