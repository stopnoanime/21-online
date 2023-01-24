import { Room, Client, Delayed } from 'colyseus';
import { Card, GameState, Player } from './schema/GameState';

export class GameRoom extends Room<GameState> {
  /** ms after which player is kicked if inactive */
  private inactivityTimeout = 30000;
  /** Current timeout kick reference */
  private inactivityKickRef: Delayed;

  /** Iterator for all players that are playing in the current round */
  private roundPlayersIdIterator: IterableIterator<string>;

  private delayedRoundStartTime = 3000;
  private delayedRoundStartRef: Delayed;

  private roundStateDealingTime = 1000;
  private roundStateEndTime = 2000;

  private minBet = 1;
  private maxBet = 100;

  public maxClients = 8;

  onCreate(options: any) {
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
        newBet < this.minBet ||
        newBet > this.maxBet // new bet is out of range
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

      if (player.hand.score == 'bust') {
        //Making player not ready basically kicks them from the current round
        player.ready = false;
        this.turn();
      } else if (player.hand.score == '21') {
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

  onJoin(client: Client, options: { displayName?: string }) {
    console.log('client join', client.sessionId);

    this.state.players.set(
      client.sessionId,
      new Player({
        sessionId: client.sessionId,
        displayName: options.displayName,
      })
    );
    this.triggerNewRoundCheck();
  }

  onLeave(client: Client, consented: boolean) {
    console.log('client leave', client.sessionId);

    this.state.players.delete(client.sessionId);
    //Player that left was the current player, skip them
    if (this.state.currentTurnPlayerId == client.sessionId) this.turn();

    this.triggerNewRoundCheck();
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }

  /** Automatically starts round if:
   * - There is no round currently
   * - All players are ready
   */
  private triggerNewRoundCheck() {
    if (this.state.roundState != 'idle') return;

    console.log('clearing delayed round start');
    this.delayedRoundStartRef?.clear();

    //If not all players are ready, exit
    if ([...this.state.players].some((p) => !p[1].ready)) return;

    console.log('setting delayed round start');
    this.delayedRoundStartRef = this.clock.setTimeout(() => {
      this.startRound();
    }, this.delayedRoundStartTime);
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

    //Deal player cards
    for (const playerId of this.makeRoundIterator()) {
      const player = this.state.players.get(playerId);

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
    }, this.roundStateDealingTime);
  }

  private turn() {
    // New turn, do not kick player from previous turn
    this.state.currentTurnTimeoutTimestamp = 0;
    this.inactivityKickRef?.clear();

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
    if (
      this.state.players.get(this.state.currentTurnPlayerId).hand.score ==
      'blackjack'
    )
      this.turn();
    else this.setInactivityKickTimeout();
  }

  private setInactivityKickTimeout() {
    this.state.currentTurnTimeoutTimestamp =
      Date.now() + this.inactivityTimeout;

    this.inactivityKickRef?.clear();

    this.inactivityKickRef = this.clock.setTimeout(() => {
      console.log('inactivity timeout');

      this.clients
        .find((c) => c.sessionId == this.state.currentTurnPlayerId)
        .leave();

      this.turn();
    }, this.inactivityTimeout);
  }

  private endRound() {
    console.log('starting end phase');

    this.state.roundState = 'end';

    //Show dealers hidden card
    this.state.dealerHand.cards.at(1).visible = true;

    // TO DO: Calculate winner, give money

    //Delay starting next phase
    this.clock.setTimeout(() => {
      console.log('starting idle phase');

      this.state.roundState = 'idle';

      //Remove all players cards, and make players not ready
      for (const player of this.state.players.values()) {
        player.hand.clear();
        player.ready = false;
      }

      //Remove dealer cards
      this.state.dealerHand.clear();
    }, this.roundStateEndTime);
  }
}
