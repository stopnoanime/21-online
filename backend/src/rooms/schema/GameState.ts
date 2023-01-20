import { Schema, MapSchema, type, ArraySchema, filter } from '@colyseus/schema';
import { Client, Deferred } from 'colyseus';

function cardFilter(this: Card, client: Client) {
  return this.discarded || this.ownerId === client.sessionId;
}

export class Card extends Schema {
  @type('string') ownerId: string;
  @type('boolean') discarded: boolean = false;

  @filter(cardFilter)
  @type('string')
  color: string;

  @filter(cardFilter)
  @type('uint8')
  value: number;
}

export class Player extends Schema {
  @type('string') sessionId: string;
  @type('string') displayName: string;
  @type('uint32') money: number = 0;

  @type([Card]) cards = new ArraySchema<Card>();

  @type('boolean') connected: boolean = true;
  reconnectionToken: Deferred<Client>;
}

export class GameState extends Schema {
  @type('string') state:
    | 'waitingForRound'
    | 'dealing'
    | 'round'
    | 'endOfRound' = 'waitingForRound';

  // Room settings:
  @type('uint8') maxPlayersAtTable: number = 8;
  @type('uint16') inactivityTimeout: number = 30;

  // Player roles:
  @type('string') adminPlayerId: string;
  @type('string') dealerPlayerId: string;
  @type('string') currentTurnPlayerId: string;

  /** Used to render timer in client */
  @type('number') endOfTurnTimestamp: number;

  /** Players that are waiting for a spot in the table */
  @type([Player]) playerQueue = new ArraySchema<Player>();

  /** Players that are currently at the table */
  @type({ map: Player }) playerTable = new MapSchema<Player>();
}
