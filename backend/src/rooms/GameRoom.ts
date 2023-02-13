import { Room, Client, Delayed } from 'colyseus';
import { GameState, Player } from './schema/GameState';
import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';
import gameConfig from '../game.config';

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

    this.onMessage('ready', (client, state: boolean) => {
      //Cant change ready state during round
      if (this.state.roundState != 'idle') return;

      console.log('received state change', state);

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

      console.log('received bet change');

      this.state.players.get(client.sessionId).bet = newBet;
    });

    this.onMessage('hit', (client) => {
      if (client.sessionId != this.state.currentTurnPlayerId) return;

      console.log('received hit');

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

      console.log('received stay');

      this.turn();
    });
  }

  onJoin(client: Client) {
    console.log('client join', client.sessionId);

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
    console.log('client leave', client.sessionId);

    //Remove player
    const player = this.state.players.get(client.sessionId);
    this.state.players.delete(client.sessionId);

    //Dispose room if there are no players left
    if (this.clients.length == 0) {
      return;
    }

    this.triggerNewRoundCheck();

    //Add player back if they rejoin
    await this.allowReconnection(client);
    this.state.players.set(client.sessionId, player.clone());
    this.triggerNewRoundCheck();
  }

  onDispose() {
    this.presence.srem(this.LOBBY_CHANNEL, this.roomId);
    console.log('room', this.roomId, 'disposing...');
  }

  /** Automatically starts round if:
   * - There is no round currently
   * - All players are ready
   */
  private triggerNewRoundCheck() {
    if (this.state.roundState != 'idle') return;

    this.delayedRoundStartRef?.clear();

    //If not all players are ready, exit
    if ([...this.state.players].some((p) => !p[1].ready)) return;

    console.log('setting delayed round start');
    this.delayedRoundStartRef = this.clock.setTimeout(() => {
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
      if (!newPlayer.value[1].ready) break;

      //Otherwise yield the new player id
      yield newPlayer.value[0] as string;
    }
  }

  private startRound() {
    console.log('starting dealing phase');

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
      console.log('starting turns phase');

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

    console.log('player turn', this.state.currentTurnPlayerId);

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
      console.log('inactivity timeout');
      this.turn();
    }, gameConfig.inactivityTimeout);
  }

  private endRound() {
    console.log('starting end phase');

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
          !(!player.hand.isBlackjack && this.state.dealerHand.isBlackjack) //And dealer does not have blackjack if player also doesn't have it
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
      console.log('starting idle phase');

      this.state.roundState = 'idle';

      //Remove all players cards, and make players not ready
      for (const player of this.state.players.values()) {
        player.hand.clear();
        player.ready = false;
        player.roundOutcome = '';
      }

      //Remove dealer cards
      this.state.dealerHand.clear();
    }, gameConfig.roundStateEndTime);
  }
}
