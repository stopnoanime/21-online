import { ColyseusTestServer, boot } from '@colyseus/testing';
import { Room } from '@colyseus/core';
import appConfig from '../src/arena.config';
import { GameState } from '../src/rooms/schema/GameState';
import gameConfig from '../src/game.config';
import { RoomInternalState } from 'colyseus';
import { jest } from '@jest/globals';

describe('test the Colyseus gameRoom', () => {
  let colyseus: ColyseusTestServer;
  let room: Room<GameState>;

  beforeAll(async () => (colyseus = await boot(appConfig)));
  afterAll(async () => await colyseus.shutdown());

  beforeEach(async () => {
    await colyseus.cleanup();
    room = await colyseus.createRoom('gameRoom');
  });

  it('connects client into room', async () => {
    const client = await colyseus.connectTo(room);

    expect(client.sessionId).toEqual(room.clients[0].sessionId);
  });

  it('creates player instance with proper properties', async () => {
    const client = await colyseus.connectTo(room);

    expect(room.state.players.size).toBe(1);

    const player = room.state.players.get(client.sessionId)!;
    expect(player).toBeTruthy();

    expect(player.sessionId).toBe(client.sessionId);

    expect(player.admin).toBe(true);

    expect(player.money).toBe(gameConfig.initialPlayerMoney);
    expect(player.bet).toBe(gameConfig.initialPlayerBet);

    expect(player.ready).toBe(false);
    expect(player.autoReady).toBe(false);
    expect(player.disconnected).toBe(false);

    expect(player.hand).toBeTruthy();
  });

  it('creates a username for client', async () => {
    const client = await colyseus.connectTo(room);

    const player = room.state.players.get(client.sessionId)!;

    expect(player.displayName.length).toBeGreaterThan(0);
  });

  it('connects multiple client into room', async () => {
    const client1 = await colyseus.connectTo(room);
    const client2 = await colyseus.connectTo(room);
    const client3 = await colyseus.connectTo(room);

    expect(room.state.players.size).toBe(3);

    const player1 = room.state.players.get(client1.sessionId)!;
    const player2 = room.state.players.get(client2.sessionId)!;
    const player3 = room.state.players.get(client3.sessionId)!;

    expect(player1).toBeTruthy();
    expect(player2).toBeTruthy();
    expect(player3).toBeTruthy();

    expect(player1.admin).toBe(true);
    expect(player2.admin).toBe(false);
    expect(player3.admin).toBe(false);
  });

  it('deletes player after client leave', async () => {
    const client = await colyseus.connectTo(room);
    const player = room.state.players.get(client.sessionId)!;

    client.leave();

    await room.waitForNextMessage();

    expect(room.state.players.size).toBe(0);

    expect(player.disconnected).toBe(true);
  });

  it('sets new admin when current one leaves', async () => {
    const client1 = await colyseus.connectTo(room);
    const client2 = await colyseus.connectTo(room);

    client1.leave();

    await room.waitForNextMessage();

    const player2 = room.state.players.get(client2.sessionId)!;

    expect(player2.admin).toBe(true);
  });

  it('disposes room when all clients leave', async () => {
    const client = await colyseus.connectTo(room);
    client.leave();

    await room.waitForNextMessage();

    expect(room.internalState).toBe(RoomInternalState.DISCONNECTING);
  });

  it('changes player ready state', async () => {
    const client = await colyseus.connectTo(room);

    client.send('ready', true);

    await room.waitForNextMessage();

    const player = room.state.players.get(client.sessionId)!;

    expect(player.ready).toBe(true);
  });

  it('changes player bet', async () => {
    const client = await colyseus.connectTo(room);

    client.send('bet', 777);

    await room.waitForNextMessage();

    const player = room.state.players.get(client.sessionId)!;

    expect(player.bet).toBe(777);
  });

  it('allows admin to kick other player', async () => {
    const client1 = await colyseus.connectTo(room);
    const client2 = await colyseus.connectTo(room);

    client1.send('kick', client2.sessionId);

    await room.waitForNextPatch();

    const player2 = room.state.players.get(client2.sessionId);

    expect(player2).toBeFalsy();
  });

  it('limits the number of clients', async () => {
    gameConfig.maxClients = 2;

    try {
      console.warn = jest.fn();
      const client1 = await colyseus.connectTo(room);
      const client2 = await colyseus.connectTo(room);
      const client3 = await colyseus.connectTo(room);
    } catch (e) {}

    expect(room.clients.length).toBe(gameConfig.maxClients);
  });

  it('starts round, takes bet and deals cards', async () => {
    gameConfig.delayedRoundStartTime = 0;

    const client = await colyseus.connectTo(room);

    client.send('ready', true);

    await room.waitForNextMessage();

    expect(room.state.nextRoundStartTimestamp).toBeTruthy();

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('dealing');

    const player = room.state.players.get(client.sessionId)!;
    expect(player.hand.cards.length).toBe(2);
    expect(player.money).toBe(
      gameConfig.initialPlayerMoney - gameConfig.initialPlayerBet
    );

    expect(room.state.dealerHand.cards.length).toBe(2);
  });

  it('ends round and cleanups', async () => {
    gameConfig.delayedRoundStartTime = 0;
    gameConfig.roundStateDealingTime = 0;
    gameConfig.inactivityTimeout = 0;
    gameConfig.dealerCardDelay = 0;
    gameConfig.roundOutcomeDelay = 0;
    gameConfig.roundStateEndTimeBase = 0;
    gameConfig.roundStateEndTimePlayer = 0;

    const client = await colyseus.connectTo(room);

    client.send('ready', true);

    await new Promise((r) => setTimeout(r, 600));

    expect(room.state.roundState).toBe('idle');

    const player = room.state.players.get(client.sessionId)!;
    expect(player.ready).toBe(false);
    expect(player.roundOutcome).toBeFalsy();
    expect(player.hand.cards.length).toBe(0);

    expect(room.state.dealerHand.cards.length).toBe(0);
  });

  it('allows player to hit', async () => {
    gameConfig.delayedRoundStartTime = 0;
    gameConfig.roundStateDealingTime = 0;
    gameConfig.inactivityTimeout = 10000;

    const client = await colyseus.connectTo(room);
    const player = room.state.players.get(client.sessionId)!;

    client.send('ready', true);

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('dealing');

    //Make player never have blackjack so it is not skipped during tests
    player.hand.isBlackjack = false;

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('turns');

    client.send('hit', true);

    await room.waitForNextMessage();

    expect(player.hand.cards.length).toBe(3);
  });

  it('allows player to stay', async () => {
    gameConfig.delayedRoundStartTime = 0;
    gameConfig.roundStateDealingTime = 0;
    gameConfig.inactivityTimeout = 10000;

    const client = await colyseus.connectTo(room);
    const player = room.state.players.get(client.sessionId)!;

    client.send('ready', true);

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('dealing');

    //Make player never have blackjack so it is not skipped during tests
    player.hand.isBlackjack = false;

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('turns');

    client.send('stay', true);

    await room.waitForNextMessage();

    expect(player.hand.cards.length).toBe(2);
    expect(room.state.roundState).toBe('end');
  });
});
