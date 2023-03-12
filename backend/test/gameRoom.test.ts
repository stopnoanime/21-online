import { ColyseusTestServer, boot } from '@colyseus/testing';
import appConfig from '../src/arena.config';
import gameConfig from '../src/game.config';
import { RoomInternalState } from 'colyseus';
import { GameRoom } from '../src/rooms/GameRoom';
import { describe, expect, test, jest } from '@jest/globals';

describe('test the Colyseus gameRoom', () => {
  let colyseus: ColyseusTestServer;
  let room: GameRoom;

  beforeAll(async () => (colyseus = await boot(appConfig)));
  afterAll(async () => await colyseus.shutdown());

  beforeEach(async () => {
    gameConfig.delayedRoundStartTime = 0;
    gameConfig.roundStateDealingTime = 0;
    gameConfig.inactivityTimeout = 0;
    gameConfig.dealerCardDelay = 0;
    gameConfig.roundOutcomeDelay = 0;
    gameConfig.roundStateEndTimeBase = 0;
    gameConfig.roundStateEndTimePlayer = 0;
    gameConfig.roomDeleteTimeout = 0;
    gameConfig.pingInterval = 1000;

    await colyseus.cleanup();
    room = (await colyseus.createRoom('gameRoom')) as any;
  });

  it('connects client into room', async () => {
    const client = await colyseus.connectTo(room);

    expect(client.sessionId).toEqual(room.clients[0].sessionId);

    expect(room.roomId.length).toEqual(gameConfig.roomIdLength);
  });

  it('sends ping to clients', async () => {
    const client = await colyseus.connectTo(room);
    const clientGotPing = new Promise((res) => client.onMessage('ping', res));

    // Client should receive ping
    await expect(clientGotPing).resolves.toBeUndefined();
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

  it('generates a username for client', async () => {
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

    await room.waitForNextPatch();

    expect(room.internalState).toBe(RoomInternalState.DISCONNECTING);
  });

  it('cancels room dispose when client connects', async () => {
    gameConfig.roomDeleteTimeout = 100;

    const client1 = await colyseus.connectTo(room);
    client1.leave();

    await room.waitForNextPatch();

    //Timeout for room deletion should be set
    expect(room.delayedRoomDeleteRef?.active).toBe(true);

    //Another client connects
    const client2 = await colyseus.connectTo(room);

    //Timeout for room deletion should be unset
    expect(room.delayedRoomDeleteRef?.active).toBe(false);
    expect(room.internalState).toBe(RoomInternalState.CREATED);
  });

  it('changes player ready state', async () => {
    const client = await colyseus.connectTo(room);

    client.send('ready', true);

    await room.waitForNextMessage();

    const player = room.state.players.get(client.sessionId)!;

    expect(player.ready).toBe(true);
  });

  it('changes player auto ready state', async () => {
    const client = await colyseus.connectTo(room);

    client.send('autoReady', true);

    await room.waitForNextMessage();

    const player = room.state.players.get(client.sessionId)!;

    expect(player.autoReady).toBe(true);
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
    const client2LeaveCode = new Promise<number>((res) => client2.onLeave(res));

    // Kick client2
    client1.send('kick', client2.sessionId);

    // Client2 should receive kick code
    await expect(client2LeaveCode).resolves.toBe(gameConfig.kickCode);

    // Player2 should be deleted
    await room.waitForNextPatch();
    expect(room.state.players.size).toBe(1);
    expect(room.state.players.get(client2.sessionId)).toBeFalsy();
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
    const client = await colyseus.connectTo(room);
    const player = room.state.players.get(client.sessionId)!;

    client.send('ready', true);
    await room.waitForNextMessage();

    expect(room.state.nextRoundStartTimestamp).toBeTruthy();

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('dealing');

    expect(player.hand.cards.length).toBe(2);
    expect(player.money).toBe(
      gameConfig.initialPlayerMoney - gameConfig.initialPlayerBet
    );

    expect(room.state.dealerHand.cards.length).toBe(2);
    expect(room.state.dealerHand.cards[0].visible).toBe(true);
    expect(room.state.dealerHand.cards[1].visible).toBe(false);
    expect(room.state.dealerHand.score).toBeFalsy();
  });

  it('calculates round outcomes and shows dealer cards', async () => {
    gameConfig.roundStateEndTimeBase = 10000;

    const client = await colyseus.connectTo(room);
    const player = room.state.players.get(client.sessionId)!;

    client.send('ready', true);

    await new Promise((r) => setTimeout(r, 700));

    expect(room.state.roundState).toBe('end');

    expect(room.state.dealerHand.cards[1].visible).toBe(true);
    expect(room.state.dealerHand.score).toBeTruthy();

    expect(player.roundOutcome).toBeTruthy();
  });

  it('ends round and cleanups', async () => {
    const client = await colyseus.connectTo(room);
    const player = room.state.players.get(client.sessionId)!;

    client.send('ready', true);

    await new Promise((r) => setTimeout(r, 700));

    expect(room.state.roundState).toBe('idle');
    expect(room.roundIteratorOffset).toBe(1);
    expect(room.state.currentTurnPlayerId).toBeFalsy();
    expect(room.state.nextRoundStartTimestamp).toBeFalsy();

    expect(player.ready).toBe(false);
    expect(player.roundOutcome).toBeFalsy();
    expect(player.hand.cards.length).toBe(0);

    expect(room.state.dealerHand.cards.length).toBe(0);
  });

  it('allows player to hit', async () => {
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

    client.send('hit');
    await room.waitForNextMessage();

    expect(player.hand.cards.length).toBe(3);
  });

  it('allows player to stay', async () => {
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

    client.send('stay');
    await room.waitForNextMessage();

    expect(player.hand.cards.length).toBe(2);
    expect(room.state.roundState).toBe('end');
    expect(room.state.currentTurnPlayerId).toBeFalsy();
  });

  it('changes turns between players', async () => {
    gameConfig.inactivityTimeout = 10000;

    const client1 = await colyseus.connectTo(room);
    const client2 = await colyseus.connectTo(room);

    const player1 = room.state.players.get(client1.sessionId)!;
    const player2 = room.state.players.get(client2.sessionId)!;

    client1.send('ready', true);
    client2.send('ready', true);

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('dealing');

    //Make player never have blackjack so it is not skipped during tests
    player1.hand.isBlackjack = false;
    player2.hand.isBlackjack = false;

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('turns');
    expect(room.state.currentTurnPlayerId).toBe(client1.sessionId);

    client1.send('stay');
    await room.waitForNextMessage();

    expect(room.state.currentTurnPlayerId).toBe(client2.sessionId);
  });

  it('skips player on blackjack', async () => {
    gameConfig.inactivityTimeout = 10000;

    const client = await colyseus.connectTo(room);
    const player = room.state.players.get(client.sessionId)!;

    client.send('ready', true);
    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('dealing');

    player.hand.isBlackjack = true;
    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('end');
    expect(room.state.currentTurnPlayerId).toBeFalsy();
  });

  it('skips player on bust', async () => {
    gameConfig.inactivityTimeout = 10000;

    const client = await colyseus.connectTo(room);
    const player = room.state.players.get(client.sessionId)!;

    client.send('ready', true);
    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('dealing');

    player.hand.isBlackjack = false;
    //Setting high value to one card ensures that on next hit the hand will bust
    player.hand.cards[0].value!.value = '100';

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('turns');

    client.send('hit');
    await room.waitForNextMessage();

    expect(player.hand.cards.length).toBe(3);
    expect(player.ready).toBe(false);
    expect(player.roundOutcome).toBe('bust');

    expect(room.state.roundState).toBe('end');
    expect(room.state.currentTurnPlayerId).toBeFalsy();
  });

  it('skips player on 21', async () => {
    gameConfig.inactivityTimeout = 10000;

    const client = await colyseus.connectTo(room);
    const player = room.state.players.get(client.sessionId)!;

    client.send('ready', true);
    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('dealing');

    player.hand.isBlackjack = false;

    await room.waitForNextPatch();

    expect(room.state.roundState).toBe('turns');

    //Disable add card function so hitting will not change score
    player.hand.addCard = jest.fn();
    player.hand.score = 21;

    client.send('hit');
    await room.waitForNextMessage();

    expect(player.ready).toBe(true);

    expect(room.state.roundState).toBe('end');
    expect(room.state.currentTurnPlayerId).toBeFalsy();
  });
});
