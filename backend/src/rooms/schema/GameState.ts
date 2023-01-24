import { Schema, MapSchema, type, ArraySchema, filter } from '@colyseus/schema';

export class CardValue extends Schema {
  @type('string') suit: string;
  @type('string') value: string;
}

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

  constructor(visible = true) {
    super();

    this.visible = visible;

    this.value = new CardValue({
      suit: this.getRandomArrayItem(this.availableSuits),
      value: this.getRandomArrayItem(this.availableValues),
    });
  }

  @type('boolean') visible: boolean;

  @filter(function (this: Card) {
    return this.visible;
  })
  @type(CardValue)
  value?: CardValue;
}

export class Player extends Schema {
  @type('string') sessionId: string;
  @type('string') displayName: string;
  @type('number') money: number = 0;
  @type('number') bet: number = 10;
  @type('boolean') ready = false;

  @type([Card]) cards = new ArraySchema<Card>();
}

export class GameState extends Schema {
  @type('string') roundState: 'idle' | 'dealing' | 'turns' | 'end' = 'idle';
  @type('string') currentTurnPlayerId: string;
  @type('uint64') currentTurnTimeoutTimestamp: number = 0;

  @type([Card]) dealerCards = new ArraySchema<Card>();
  @type({ map: Player }) players = new MapSchema<Player>();
}
