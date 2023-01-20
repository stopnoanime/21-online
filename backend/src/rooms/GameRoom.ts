import { Room, Client, Delayed } from 'colyseus';
import { GameState, Player } from './schema/GameState';

export class GameRoom extends Room<GameState> {
  /** ms after which player is kicked if inactive */
  private inactivityTimeout = 30000;
  /** Current timeout kick reference */
  private inactivityKickRef: Delayed;

  /** Iterator for all players that are playing in the current round */
  private roundPlayersIterator: IterableIterator<[string, Player]>;

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

      //If all players are ready, start round
      if ([...this.state.players].every((p) => p[1].ready)) this.startRound();
    });
  }

  onJoin(client: Client, options: { displayName?: string }) {
    console.log('client join', client.sessionId);

    this.state.players.set(
      client.sessionId,
      new Player({
        id: client.sessionId,
        displayName: options.displayName,
      })
    );
  }

  onLeave(client: Client, consented: boolean) {
    console.log('client leave', client.sessionId);

    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }

  private startRound() {
    console.log('starting round');

    this.state.roundInProgress = true;

    // TO DO: Deal cards

    this.roundPlayersIterator = this.state.players.entries();
    this.turn();
  }

  private turn() {
    // New turn, do not kick player from previous turn
    this.inactivityKickRef?.clear();

    // Get next player
    const nextPlayer = this.roundPlayersIterator.next();

    // If there are no more players, end current round
    if (nextPlayer.done) {
      this.endRound();
      return;
    }

    // Otherwise go to next player
    this.state.currentTurnPlayerId = nextPlayer.value[0];

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

    // TO DO: Calculate winner, give money
  }
}
