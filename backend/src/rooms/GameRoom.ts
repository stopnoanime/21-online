import { Room, Client, Delayed } from 'colyseus';
import { GameState, Player } from './schema/GameState';
import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';
import gameConfig from '../game.config';
import log from 'npmlog';

export class GameRoom extends Room<GameState> {
  /** Current timeout skip reference */
  private inactivityTimeoutRef: Delayed;

  /** Iterator for all players that are playing in the current round */
  private roundPlayersIdIterator: IterableIterator<string>;

  private delayedRoundStartRef: Delayed;

  public maxClients = gameConfig.maxClients;

  private LOBBY_CHANNEL = 'GameRoom';

  private generateRoomIdString(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++)
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  }

  private async generateRoomId(): Promise<string> {
    const currentIds = await this.presence.smembers(this.LOBBY_CHANNEL);
    let id;

    do id = this.generateRoomIdString();
    while (currentIds.includes(id));

    await this.presence.sadd(this.LOBBY_CHANNEL, id);
    return id;
  }

  async onCreate() {
    this.roomId = await this.generateRoomId();
    this.setPrivate();
    this.setState(new GameState({}));
    this.clock.start();

    log.info(`room ${this.roomId}`, `Created`);

    this.onMessage('ready', (client, state: boolean) => {
      //Cant change ready state during round
      if (this.state.roundState != 'idle') return;

      log.info(`client ${client.sessionId}`, `Ready state change: ${state}`);

      this.state.players.get(client.sessionId).ready = state;
      this.triggerNewRoundCheck();
    });

    this.onMessage('bet', (client, newBet: number) => {
      if (
        this.state.roundState != 'idle' || //Cant change bet during round
        this.state.players.get(client.sessionId).ready || //Cant change bet when ready
        !Number.isInteger(newBet) || // new bet is invalid
        newBet < gameConfig.minBet ||
        newBet > gameConfig.maxBet // new bet is out of range
      )
        return;

      log.info(`client ${client.sessionId}`, `Bet change: ${newBet}`);

      this.state.players.get(client.sessionId).bet = newBet;
    });

    this.onMessage('hit', (client) => {
      if (client.sessionId != this.state.currentTurnPlayerId) return;

      log.info(`client ${client.sessionId}`, `Hit`);

      const player = this.state.players.get(client.sessionId);

      player.hand.addCard();

      if (player.hand.isBusted) {
        //Making player not ready basically kicks them from the current round
        player.ready = false;
        player.roundOutcome = 'bust';
        this.turn();
      } else if (player.hand.score == 21) {
        //Player can't hit anymore, go to next player
        this.turn();
      } else {
        //Player can still hit, Reset kick timer
        this.setInactivityKickTimeout();
      }
    });

    this.onMessage('stay', (client) => {
      if (client.sessionId != this.state.currentTurnPlayerId) return;

      log.info(`client ${client.sessionId}`, `Stay`);

      this.turn();
    });
  }

  onJoin(client: Client) {
    log.info(`client ${client.sessionId}`, `Join`);

    this.state.players.set(
      client.sessionId,
      new Player({
        sessionId: client.sessionId,
        displayName: uniqueNamesGenerator({
          dictionaries: [colors, animals],
          separator: ' ',
          style: 'capital',
        }),
      })
    );
    this.triggerNewRoundCheck();
  }

  async onLeave(client: Client, consented: boolean) {
    log.info(`client ${client.sessionId}`, `Leave`);

    const player = this.state.players.get(client.sessionId);
    player.disconnected = true;

    //Remove player if leave was consented or if they are not in round
    if (consented || !(this.state.roundState != 'idle' && player.ready)) {
      this.state.players.delete(client.sessionId);
      this.triggerNewRoundCheck();
    }

    //Do not allow for rejoin if leave was consented or there are no other players left in room
    if (consented || this.state.players.size == 0) {
      return;
    }

    //Add player back if they rejoin
    await this.allowReconnection(client);

    log.info(`client ${client.sessionId}`, `Reconnect`);

    player.disconnected = false;

    //Add player back if they were removed earlier
    if (!this.state.players.has(client.sessionId)) {
      this.state.players.set(client.sessionId, player.clone());
      this.triggerNewRoundCheck();
    }
  }

  onDispose() {
    this.presence.srem(this.LOBBY_CHANNEL, this.roomId);
    log.info(`room ${this.roomId}`, `Disposing`);
  }

  /** Automatically starts round if:
   * - There is no round currently
   * - All players are ready
   */
  private triggerNewRoundCheck() {
    if (this.state.roundState != 'idle') return;

    //Clear previous start
    this.state.nextRoundStartTimestamp = 0;
    this.delayedRoundStartRef?.clear();

    const playerArr = [...this.state.players];
    //If there are no players left or not all players are ready, exit
    if (playerArr.length == 0 || playerArr.some((p) => !p[1].ready)) return;

    log.info(`room ${this.roomId}`, `Setting delayed round start`);

    this.state.nextRoundStartTimestamp =
      Date.now() + gameConfig.delayedRoundStartTime;
    this.delayedRoundStartRef = this.clock.setTimeout(() => {
      this.state.nextRoundStartTimestamp = 0;
      this.startRound();
    }, gameConfig.delayedRoundStartTime);
  }

  /** Iterator over players that only takes ready players into account */
  private *makeRoundIterator() {
    const playerIterator = this.state.players.entries();

    while (true) {
      const newPlayer = playerIterator.next();

      //Finish this iterator when base iterator finishes
      if (newPlayer.done) return;

      //If grabbed player is not ready, go to next player
      if (!newPlayer.value[1].ready) continue;

      //Otherwise yield the new player id
      yield newPlayer.value[0] as string;
    }
  }

  private startRound() {
    log.info(`room ${this.roomId}`, `Starting dealing phase`);

    this.state.roundState = 'dealing';

    for (const playerId of this.makeRoundIterator()) {
      const player = this.state.players.get(playerId);

      //Take money for bet from player account
      player.money -= player.bet;

      //Deal player cards
      player.hand.clear();
      player.hand.addCard();
      player.hand.addCard();
    }

    //Deal dealer cards
    this.state.dealerHand.clear();
    this.state.dealerHand.addCard();
    this.state.dealerHand.addCard(false);

    //Delay starting next phase
    this.clock.setTimeout(() => {
      log.info(`room ${this.roomId}`, `Starting turns phase`);

      this.state.roundState = 'turns';

      //Setup iterator for turns
      this.roundPlayersIdIterator = this.makeRoundIterator();

      this.turn();
    }, gameConfig.roundStateDealingTime);
  }

  private turn() {
    // New turn, do not kick player from previous turn
    this.state.currentTurnTimeoutTimestamp = 0;
    this.inactivityTimeoutRef?.clear();

    // Get next player
    const nextPlayer = this.roundPlayersIdIterator.next();
    this.state.currentTurnPlayerId = nextPlayer.value || '';

    // If there are no more players, end current round
    if (nextPlayer.done) {
      this.endRound();
      return;
    }

    log.info(
      `room ${this.roomId}`,
      `Client ${this.state.currentTurnPlayerId} turn`
    );

    //Skip round if player has blackjack
    if (this.state.players.get(this.state.currentTurnPlayerId).hand.score == 21)
      this.turn();
    else this.setInactivityKickTimeout();
  }

  private setInactivityKickTimeout() {
    this.state.currentTurnTimeoutTimestamp =
      Date.now() + gameConfig.inactivityTimeout;

    this.inactivityTimeoutRef?.clear();

    this.inactivityTimeoutRef = this.clock.setTimeout(() => {
      log.info(
        `client ${this.state.currentTurnPlayerId}`,
        `Inactivity timeout`
      );
      this.turn();
    }, gameConfig.inactivityTimeout);
  }

  private endRound() {
    log.info(`room ${this.roomId}`, `Starting end phase`);

    this.state.roundState = 'end';

    //Show dealers hidden card
    this.state.dealerHand.cards.at(1).visible = true;

    //Calculate hand value after showing hidden card
    this.state.dealerHand.calculateScore();

    //Do not deal dealer cards if all players are busted
    if (!this.makeRoundIterator().next().done) {
      //Dealer draws cards until total is at least 17
      while (this.state.dealerHand.score < 17) {
        this.state.dealerHand.addCard();
      }

      //Settle score between each player that's not busted, and dealer
      for (const playerId of this.makeRoundIterator()) {
        const player = this.state.players.get(playerId);

        if (player.hand.isBlackjack && !this.state.dealerHand.isBlackjack) {
          // Player wins 3:2
          player.money += (5 / 2) * player.bet;
          player.roundOutcome = 'win';
        } else if (
          this.state.dealerHand.isBusted || //dealer busted, player wins
          player.hand.score > this.state.dealerHand.score // player has higher score than dealer, player wins
        ) {
          player.money += player.bet * 2;
          player.roundOutcome = 'win';
        } else if (
          player.hand.score == this.state.dealerHand.score && //Score is the same
          player.hand.isBlackjack == this.state.dealerHand.isBlackjack //And dealer does not have blackjack if player also doesn't have it
        ) {
          player.money += player.bet;
          player.roundOutcome = 'draw';
        } else {
          player.roundOutcome = 'lose';
        }
      }
    }

    //Delay starting next phase
    this.clock.setTimeout(() => {
      log.info(`room ${this.roomId}`, `Starting idle phase`);

      this.state.roundState = 'idle';

      //Remove all players cards, and make players not ready
      for (const player of this.state.players.values()) {
        player.hand.clear();
        player.ready = false;
        player.roundOutcome = '';

        //Remove players that are still disconnected
        if (player.disconnected) {
          this.state.players.delete(player.sessionId);
        }
      }

      //Remove dealer cards
      this.state.dealerHand.clear();
    }, gameConfig.roundStateEndTime);
  }
}
