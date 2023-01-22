import { Schema, MapSchema, type, ArraySchema } from '@colyseus/schema';

export class Card extends Schema {
  private availableSuits = ['Hearts', 'Diamonds', 'Spades', 'Clubs'];
  private availableValues = [
    'A',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
  ];
  private getRandomArrayItem<Type>(arr: Type[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  constructor() {
    super();

    this.suit = this.getRandomArrayItem(this.availableSuits);
    this.value = this.getRandomArrayItem(this.availableValues);
  }

  @type('string') suit: string;
  @type('string') value: string;
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
  @type('uint64') currentTurnTimeoutTimestamp: number = 0;

  @type([Card]) dealerCards = new ArraySchema<Card>();
  @type({ map: Player }) players = new MapSchema<Player>();
}
