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
  public kickEvent = new Subject<void>();
  public roomErrorEvent = new Subject<string>();
  public joinInProgress = false;
  public connectedBefore = false;

  private _room?: Colyseus.Room<GameState>;
  public pingTimeout?: number;
  public client: Colyseus.Client;

  public get room() {
    return this._room;
  }

  public get roundInProgress() {
    return !!this._room && this._room.state.roundState != 'idle';
  }

  public get roundEndTimestamp() {
    return this._room?.state.currentTurnTimeoutTimestamp || 0;
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

  constructor(private router: Router) {
    this.client = new Colyseus.Client(environment.gameServer);
  }

  public createRoom() {
    return this.updateRoom(() => this.client.create('gameRoom'), true);
  }

  public joinRoom(id: string) {
    return this.updateRoom(() => this.client.joinById(id.toUpperCase()), true);
  }

  /**
   * Given roomId and sessionId tries to reconnect to a room and returns if it was successful
   * @param roomId The roomId
   * @param sessionId The room sessionId
   * @returns True if reconnection was successful, false otherwise
   */
  public async reconnectRoom(roomId?: string, sessionId?: string) {
    if (!roomId) return false;

    //Try to reconnect
    if (sessionId) {
      const connected = await this.updateRoom(() =>
        this.client.reconnect(roomId, sessionId)
      );

      if (connected) return true;
    }

    //Reconnecting was not successful, try to connect, and return if it was successful
    return this.updateRoom(() => this.client.joinById(roomId));
  }

  /**
   * Tries to reconnect to a room whose data was saved in localStorage and returns if it was successful
   * @returns True if reconnection was successful, false otherwise
   */
  public async reconnectSavedRoom() {
    const roomData = this.loadRoomData();

    if (!roomData) return false;

    //Try to reconnect
    return this.updateRoom(
      () => this.client.reconnect(roomData.roomId, roomData.sessionId),
      false,
      true
    );
  }

  public setReadyState(newState: boolean) {
    this.room?.send('ready', newState);
  }

  public setAutoReadyState(newState: boolean) {
    this.room?.send('autoReady', newState);
  }

  public changeBet(change: number) {
    if (!this.player) return;

    this.room?.send('bet', this.player?.bet + change);
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

  /**
   * Tries to connect to given room and on success sets up lifecycle hooks
   * @param room The room
   * @param emitErrorEvent If true, on connection error a message is displayed to the user
   * @param deleteRoomDataOnInvalidRoomId If true, on connection error the localStorage room data is deleted
   * @returns If connecting was successful
   */
  public async updateRoom(
    room: () => Promise<Colyseus.Room<GameState>>,
    emitErrorEvent = false,
    deleteRoomDataOnInvalidRoomId = false
  ) {
    if (this.joinInProgress) return false;
    this.joinInProgress = true;

    try {
      this._room = await room();
    } catch (error: any) {
      //Was not able to connect

      if (emitErrorEvent)
        this.roomErrorEvent.next(this.convertRoomErrorToMessage(error));

      if (
        deleteRoomDataOnInvalidRoomId &&
        error?.code === Colyseus.ErrorCode.MATCHMAKE_INVALID_ROOM_ID
      )
        this.deleteRoomData();

      this.joinInProgress = false;
      return false;
    }

    // Connected

    this.connectedBefore = true;
    this.saveRoomData(this._room);

    this._room.onLeave((code) => {
      this._room = undefined;
      window.clearTimeout(this.pingTimeout);

      if (code == gameConfig.kickCode) this.kickEvent.next();

      // Player was kicked or they consented left, delete saved data
      if (code == gameConfig.kickCode || code == 1000) this.deleteRoomData();

      // Abnormal websocket shutdown
      if (code == 1006) this.roomErrorEvent.next('Lost connection to server');

      this.router.navigate(['/']);
    });

    // Setup connection lost popup
    this.ping();
    this._room.onMessage('ping', () => this.ping());

    this.router.navigate(['/room', this._room.id], {
      queryParams: { session: this._room.sessionId },
    });

    this.joinInProgress = false;
    return true;
  }

  private ping() {
    window.clearTimeout(this.pingTimeout);

    this.pingTimeout = window.setTimeout(() => {
      this.roomErrorEvent.next('No connection to server');
      this.ping();
    }, gameConfig.pingInterval * 2);
  }
  /**
   * Saves room data to localStorage
   */
  private saveRoomData(room: Colyseus.Room) {
    localStorage.setItem('roomId', room.id);
    localStorage.setItem('sessionId', room.sessionId);
  }

  /**
   * Loads room data from localStorage
   */
  private loadRoomData() {
    const roomId = localStorage.getItem('roomId');
    const sessionId = localStorage.getItem('sessionId');

    if (!roomId || !sessionId) return null;

    return { roomId: roomId, sessionId: sessionId };
  }

  /**
   * Deletes room data from localStorage
   */
  private deleteRoomData() {
    localStorage.removeItem('roomId');
    localStorage.removeItem('sessionId');
  }

  private convertRoomErrorToMessage(error: any): string {
    if (error instanceof ProgressEvent) return `Can't connect to server`;

    if (error?.code === gameConfig.roomFullCode) return 'Room is full';
    if (error?.code === Colyseus.ErrorCode.MATCHMAKE_INVALID_ROOM_ID)
      return 'Invalid room ID';

    return 'Internal server error';
  }
}
