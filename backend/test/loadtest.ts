import { Room } from 'colyseus.js';

export function onJoin(this: Room) {
  console.log(this.sessionId, 'joined.');

  this.send('autoReady', true);
  this.onMessage('ping', () => null);
}

export function onLeave(this: Room) {
  console.log(this.sessionId, 'left.');
}

export function onError(this: Room, err) {
  console.error(this.sessionId, '!! ERROR !!', err.message);
}
