import { Room, Client } from 'colyseus';
import { GameState, Player } from './schema/GameState';

export class GameRoom extends Room<GameState> {
  onCreate(options: any) {
    this.setPrivate();
    this.setState(new GameState({}));

    this.onMessage('type', (client, message) => {
      //
      // handle "type" message
      //
    });
  }

  onJoin(client: Client, options: { displayName?: string }) {
    const player = new Player({
      id: client.sessionId,
      displayName: options.displayName,
    });

    //Add player directly to table
    if (
      this.state.state == 'waitingForRound' &&
      this.state.playerTable.size <= this.state.maxPlayersAtTable
    ) {
      this.state.playerTable.set(client.sessionId, player);
    } else {
      //add player to queue
      this.state.playerQueue.push(player);
    }

    console.log(client.sessionId, 'joined!');
  }

  async onLeave(client: Client, consented: boolean) {
    //Player is at the table
    if (this.state.playerTable.has(client.sessionId)) {
      try {
        //If player wanted to leave, or game is not in progress
        if (consented || this.state.state == 'waitingForRound')
          throw new Error('leave');

        // get player instance
        const player = this.state.playerTable.get(client.sessionId);

        // mark player as inactive
        player.connected = false;

        // get and store the reconnection token
        const reconnection = this.allowReconnection(client);
        player.reconnectionToken = reconnection;

        // //
        // // here is the custom logic for rejecting the reconnection.
        // // for demonstration purposes of the API, an interval is created
        // // rejecting the reconnection if the player has missed 2 rounds,
        // // (assuming he's playing a turn-based game)
        // //
        // // in a real scenario, you would store the `reconnection` in
        // // your Player instance, for example, and perform this check during your
        // // game loop logic
        // //
        // const currentRound = this.state.currentRound;
        // const interval = setInterval(() => {
        //   if (this.state.currentRound - currentRound > 2) {
        //     // manually reject the client reconnection
        //     reconnection.reject();
        //     clearInterval(interval);
        //   }
        // }, 1000);

        // allow disconnected client to reconnect
        await reconnection;

        // client returned! let's re-activate it.
        this.state.playerTable.get(client.sessionId).connected = true;
      } catch (e) {
        // Kick the player from the table
        this.state.playerTable.delete(client.sessionId);
      }
    } else {
      //Player is in queue, kick it instantly
      this.state.playerQueue.deleteAt(
        this.state.playerQueue.findIndex((p) => p.sessionId == client.sessionId)
      );
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }
}
