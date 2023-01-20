import { Room, Client, Delayed } from 'colyseus';
import { GameState, Player, roundState } from './schema/GameState';

export class GameRoom extends Room<GameState> {
  onCreate(options: any) {
    this.setPrivate();
    this.setState(new GameState({}));
    this.clock.start();

    this.onMessage('adminEvent', (client, message: string) => {
      if (client.sessionId != this.state.adminPlayerId) return;

      switch (message) {
        case 'startRound':
          console.log('starting round');
          this.startRound();
          break;
      }
    });

    this.onMessage('move', (client, message: string) => {
      if (
        client.sessionId != this.state.currentPlayerId ||
        this.state.state != 'round'
      )
        return;

      // TO DO: move handling logic

      this.nextTurn();
    });
  }

  onJoin(client: Client, options: { displayName?: string }) {
    const player = new Player({
      id: client.sessionId,
      displayName: options.displayName,
    });

    if (
      this.state.state == 'waitingForRound' &&
      this.state.playerTable.size <= this.state.maxPlayersAtTable
    ) {
      //Add player directly to table
      this.state.playerTable.set(client.sessionId, player);
    } else {
      //add player to queue
      this.state.playerQueue.push(player);
    }

    if (this.state.playerQueue.length + this.state.playerTable.size == 1) {
      // Joined player is the only player; Set them as admin
      this.state.adminPlayerId = client.sessionId;
    }

    console.log(client.sessionId, 'joined!');
  }

  async onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'leave');

    //Player is at the table
    if (this.state.playerTable.has(client.sessionId)) {
      try {
        //If game is not in progress
        if (this.state.state == 'waitingForRound') throw new Error('leave');

        // get player instance
        const player = this.state.playerTable.get(client.sessionId);

        // mark player as inactive
        player.connected = false;

        // get and store the reconnection token
        const reconnection = this.allowReconnection(client);
        player.reconnectionToken = reconnection;

        // allow disconnected client to reconnect
        await reconnection;

        // client returned! let's re-activate it.
        console.log(client.sessionId, 'recconected');
        this.state.playerTable.get(client.sessionId).connected = true;
      } catch (e) {
        // Kick the player from the table
        this.state.playerTable.delete(client.sessionId);
        this.setNewAdmin(client.sessionId);
      }
    } else {
      //If player is in queue, kick it instantly
      this.state.playerQueue.deleteAt(
        this.state.playerQueue.findIndex((p) => p.sessionId == client.sessionId)
      );
      this.setNewAdmin(client.sessionId);
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }

  private startRound() {
    if (this.state.state != 'waitingForRound') return;
    this.changeRoundState('dealing');

    // TO DO: Deal cards

    // Set dealer and current player to the first player at the table
    this.state.dealerPlayerId = this.state.currentPlayerId =
      this.state.playerTable.entries().next().value[0];

    // Wait 5 seconds for dealing animations to play, then start the round
    this.clock.setTimeout(() => {
      this.changeRoundState('round');
      this.nextTurn();
    }, 5000);
  }

  private inactivityKickTimeout: Delayed;
  private nextTurn() {
    if (this.state.state != 'round') return;
    console.log('new turn');

    // New turn, do not kick player from previous turn
    this.inactivityKickTimeout?.clear();

    // TO DO: Check if there are any players left, Go to next player at table
    //this.state.currentPlayerId = '';

    // Set timeout after which a player will be kicked;
    this.inactivityKickTimeout = this.clock.setTimeout(() => {
      console.log('inactivty timeout');

      const player = this.state.playerTable.get(this.state.currentPlayerId);

      if (!player.connected) {
        //Player is not connected, rejects its reconnection token after timeout
        player.reconnectionToken.reject();
      } else {
        //Player is connected, kick it
        this.state.playerTable.delete(this.state.currentPlayerId);
        this.clients
          .find((c) => c.sessionId == this.state.currentPlayerId)
          .leave();
      }

      //Move to next player
      this.nextTurn();
    }, this.state.inactivityTimeout * 1000);

    // TO DO: add logic to trigger end of round
    // this.endRound();
  }

  private endRound() {
    if (this.state.state != 'round') return;
    this.changeRoundState('endOfRound');

    // TO DO: Calculate winner, give money

    // Wait 5 seconds for dealing animations to play, then end the round
    this.clock.setTimeout(() => {
      this.changeRoundState('waitingForRound');
    }, 5000);
  }

  private changeRoundState(newState: roundState) {
    this.state.state = newState;
    this.broadcast('state-change', newState);
  }

  private setNewAdmin(disconnectedId: string) {
    if (this.state.adminPlayerId != disconnectedId) return;

    console.log('new admin');
    // TO DO: set new admin
  }
}
