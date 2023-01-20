import { Room, Client, Delayed } from 'colyseus';
import { GameState, Player } from './schema/GameState';

export class GameRoom extends Room<GameState> {
  /** ms after which player is kicked if inactive */
  private inactivityTimeout = 30000;
  /** Current timeout kick reference */
  private inactivityKickRef: Delayed;

  /** Iterator for all players that are playing in the current round */
  private roundPlayersIdIterator: IterableIterator<string>;

  private delayedRoundStartTimeout = 5000;
  private delayedRoundStartRef: Delayed;

  public maxClients = 8;

  onCreate(options: any) {
    this.setPrivate();
    this.setState(new GameState({}));
    this.clock.start();

    this.onMessage('move', (client, message: string) => {
      if (
        !this.state.roundInProgress ||
        client.sessionId != this.state.currentTurnPlayerId
      )
        return;

      console.log('recived move');

      // TO DO: move handling logic

      this.turn();
    });

    this.onMessage('ready', (client, message: boolean) => {
      //Cant change ready state during round
      if (this.state.roundInProgress) return;

      console.log('recived state change', message);

      this.state.players.get(client.sessionId).ready = message;

      this.triggerNewRoundCheck();
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
    if (this.state.roundInProgress) return;

    console.log('clearing delayed round start');
    this.delayedRoundStartRef?.clear();

    //If not all players are ready, exit
    if ([...this.state.players].some((p) => !p[1].ready)) return;

    console.log('setting delayed round start');
    this.delayedRoundStartRef = this.clock.setTimeout(() => {
      this.startRound();
    }, this.delayedRoundStartTimeout);
  }

  private startRound() {
    console.log('starting round');

    this.state.roundInProgress = true;

    // TO DO: Deal cards

    //Only include users that have the ready state
    this.roundPlayersIdIterator = [...this.state.players]
      .filter((v) => v[1].ready)
      .map((v) => v[0])
      .values();

    this.turn();
  }

  private turn() {
    // New turn, do not kick player from previous turn
    this.inactivityKickRef?.clear();

    // Get next player
    const nextPlayer = this.roundPlayersIdIterator.next();

    // If there are no more players, end current round
    if (nextPlayer.done) {
      this.endRound();
      return;
    }

    // Otherwise go to next player
    this.state.currentTurnPlayerId = nextPlayer.value;

    console.log('player turn', this.state.currentTurnPlayerId);

    // And set inactivity timeout after which they will be kicked;
    this.inactivityKickRef = this.clock.setTimeout(() => {
      console.log('inactivity timeout');

      this.clients
        .find((c) => c.sessionId == this.state.currentTurnPlayerId)
        .leave();

      this.turn();
    }, this.inactivityTimeout);
  }

  private endRound() {
    console.log('ending round');

    this.state.roundInProgress = false;
    this.state.currentTurnPlayerId = '';

    // TO DO: Calculate winner, give money

    this.triggerNewRoundCheck();
  }
}
