import Arena from '@colyseus/arena';
import { GameRoom } from './rooms/GameRoom';

export default Arena({
  options: {
    greet: false,
  },

  getId: () => '21-Online',

  initializeGameServer: (gameServer) => {
    gameServer.define('gameRoom', GameRoom);
  },
});
