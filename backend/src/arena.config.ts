import Arena from '@colyseus/arena';
import { monitor } from '@colyseus/monitor';
import { GameRoom } from './rooms/GameRoom';

export default Arena({
  getId: () => 'Your Colyseus App',

  initializeGameServer: (gameServer) => {
    gameServer.define('gameRoom', GameRoom);
  },

  initializeExpress: (app) => {
    app.get('/', (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Bind @colyseus/monitor
     * It is recommended to protect this route with a password.
     * Read more: https://docs.colyseus.io/tools/monitor/
     */
    app.use('/colyseus', monitor());
  },

  beforeListen: () => {},
});
