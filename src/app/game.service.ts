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

    this.reconnectToPreviousRoom();
  }

  public async createRoom() {
    this.updateRoom(await this.client.create('gameRoom'));
  }

  public async joinRoom(id: string) {
    this.updateRoom(await this.client.joinById(id));
  }

  public startRound() {
    this.room?.send('adminEvent', 'startRound');
  }

  public sendMove() {
    this.room?.send('move');
  }

  private updateRoom(room: Colyseus.Room<GameState>) {
    this.room = room;
    this.room.onStateChange((s) => this.stateChange.next(s));
    this.saveRoomData();
  }

  private async reconnectToPreviousRoom() {
    try {
      const loadedData = this.loadRoomData();
      this.updateRoom(
        await this.client.reconnect(loadedData.roomId, loadedData.sessionId)
      );
    } catch {
      //Clear invalid room data
      this.setRoomData('', '');
    }
  }

  private saveRoomData() {
    this.setRoomData(this.room?.id, this.room?.sessionId);
  }

  private setRoomData(id?: string, sessionId?: string) {
    localStorage.setItem('roomId', id || '');
    localStorage.setItem('sessionId', sessionId || '');
  }

  private loadRoomData() {
    const roomId = localStorage.getItem('roomId');
    const sessionId = localStorage.getItem('sessionId');

    if (!roomId || !sessionId) throw new Error('No saved room');

    return {
      roomId: roomId,
      sessionId: sessionId,
    };
  }
}
