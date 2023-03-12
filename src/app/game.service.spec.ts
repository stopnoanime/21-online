import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import gameConfig from 'backend/src/game.config';
import { GameState } from 'backend/src/rooms/schema/GameState';
import { Room } from 'colyseus.js';
import { GameService } from './game.service';
import * as Colyseus from 'colyseus.js';

describe('GameService', () => {
  let service: GameService;
  let localStore: { [key: string]: string } = {};
  let mockRouter: { navigate: jasmine.Spy };

  beforeEach(() => {
    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });
    service = TestBed.inject(GameService);

    //Mock local storage
    localStore = {};
    spyOn(localStorage, 'getItem').and.callFake((key) => localStore[key]);
    spyOn(localStorage, 'removeItem').and.callFake(
      (key) => delete localStore[key]
    );
    spyOn(localStorage, 'setItem').and.callFake(
      (key, value) => (localStore[key] = value.toString())
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('updates room and callbacks', async () => {
    let onLeaveCb: ((c: number) => void) | undefined;
    let onMessageCb: (() => void) | undefined;
    const fakeRoom = {
      id: 'id',
      sessionId: 'sessionId',
      onLeaveCb: null,
      onLeave: (cb: any) => (onLeaveCb = cb),
      onMessage: (m: string, cb: any) => (onMessageCb = cb),
    } as any as Room<GameState>;
    let kickEventTriggered = false;
    service.kickEvent.subscribe(() => (kickEventTriggered = true));

    const connected = await service.updateRoom(() => Promise.resolve(fakeRoom));
    expect(connected).toBeTrue();

    expect(service.room === fakeRoom);
    expect(onLeaveCb).toBeTruthy();
    expect(onMessageCb).toBeTruthy();

    //There should be a ping timeout set
    expect(service.pingTimeout).toBeDefined();

    //New timeout should be set when client receives ping
    const oldPingId = service.pingTimeout;
    onMessageCb!();
    expect(oldPingId).not.toBe(service.pingTimeout);

    // Room data should have been saved in localStorage
    expect(localStore['roomId']).toBe(fakeRoom.id);
    expect(localStore['sessionId']).toBe(fakeRoom.sessionId);

    // Should have benn redirected to correct URL
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(
      [`/room`, fakeRoom.id],
      { queryParams: { session: fakeRoom.sessionId } }
    );

    // Simulate kicking player from room
    onLeaveCb!(gameConfig.kickCode);

    expect(service.room).toBeFalsy();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);

    // Expect events to be emitted
    expect(kickEventTriggered).toBe(true);

    // Room data should have been deleted on kick
    expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
  });

  it('emits roomErrorEvent on room load error', async () => {
    let errorEvent = '';
    service.roomErrorEvent.subscribe((s) => (errorEvent = s));

    //Reject room with error
    const connected = await service.updateRoom(
      () =>
        Promise.reject({ code: Colyseus.ErrorCode.MATCHMAKE_INVALID_ROOM_ID }),
      true
    );
    expect(connected).toBeFalse();

    expect(errorEvent).toBe('Invalid room ID');
  });

  it('deletes roomData on room load error', async () => {
    const connected = await service.updateRoom(
      () =>
        Promise.reject({ code: Colyseus.ErrorCode.MATCHMAKE_INVALID_ROOM_ID }),
      false,
      true
    );
    expect(connected).toBeFalse();

    //Invalid room data should have benn deleted
    expect(localStorage.removeItem).toHaveBeenCalledTimes(2);
  });

  it('reconnects to room using localStorage', async () => {
    spyOn(service.client, 'reconnect').and.callFake((_) => Promise.reject());
    localStore = {
      roomId: 'id',
      sessionId: 'sId',
    };

    const connected = await service.reconnectSavedRoom();

    expect(connected).toBeFalse();

    expect(localStorage.getItem).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem).toHaveBeenCalledWith('roomId');
    expect(localStorage.getItem).toHaveBeenCalledWith('sessionId');

    expect(service.client.reconnect).toHaveBeenCalledOnceWith('id', 'sId');
  });

  it('outputs correct values on getters', async () => {
    const player = {} as any;
    const fakeRoom = {
      id: 'id',
      sessionId: 'sessionId',
      onLeave: () => null,
      onMessage: () => null,
      state: {
        roundState: 'idle',
        players: new Map([['sessionId', player]]),
      },
    } as any;

    await service.updateRoom(() => Promise.resolve(fakeRoom as any));

    expect(service.room).toBeTruthy();

    // Test roundInProgress
    expect(service.roundInProgress).toBeFalse();
    fakeRoom.state.roundState = 'turns';
    expect(service.roundInProgress).toBeTrue();

    // Test roundEndTimestamp
    expect(service.roundEndTimestamp).toBe(0);
    fakeRoom.state.currentTurnTimeoutTimestamp = 1000;
    expect(service.roundEndTimestamp).toBe(1000);

    // Test player
    expect(service.player).toBe(player);

    // Test playersTurn
    expect(service.playersTurn).toBeFalse();
    fakeRoom.state.currentTurnPlayerId = 'differentId';
    expect(service.playersTurn).toBeFalse();
    fakeRoom.state.currentTurnPlayerId = 'sessionId';
    expect(service.playersTurn).toBeTrue();
  });
});
