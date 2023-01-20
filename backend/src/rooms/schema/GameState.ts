import { Schema, MapSchema, type, ArraySchema } from '@colyseus/schema';

export class Card extends Schema {
  @type('string') color: string;
  @type('uint8') value: number;
}

export class Player extends Schema {
  @type('string') sessionId: string;
  @type('string') displayName: string;
  @type('uint32') money: number = 0;
  @type('boolean') ready = false;

  @type([Card]) cards = new ArraySchema<Card>();
}

export class GameState extends Schema {
  @type('boolean') roundInProgress = false;
  @type('string') currentTurnPlayerId: string;

  @type([Card]) dealerCards = new ArraySchema<Card>();
  @type({ map: Player }) players = new MapSchema<Player>();
}
