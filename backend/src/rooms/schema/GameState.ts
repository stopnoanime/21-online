import { Schema, MapSchema, type, ArraySchema, filter } from '@colyseus/schema';

export class CardValue extends Schema {
  @type('string') suit: string;
  @type('string') value: string;

  public get numericValue() {
    if (this.value == 'A') return 11;
    if (isNaN(Number(this.value))) return 10;
    return Number(this.value);
  }
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

export class Hand extends Schema {
  @type('string') score: string;
  @type([Card]) cards = new ArraySchema<Card>();

  public addCard(visible?: boolean) {
    this.cards.push(new Card(visible));
    this.score = this.calculatePoints().toString();
  }

  public clear() {
    this.cards.clear();
    this.score = '';
  }

  public calculatePoints() {
    let tmpValue = this.cards
      .map((c) => c.value!.numericValue)
      .reduce((a, b) => a + b);

    let numberOfAces = this.cards.filter((c) => c.value!.value === 'A').length;
    while (numberOfAces > 0) {
      if (tmpValue > 21) {
        numberOfAces--;
        tmpValue -= 10;
      } else break;
    }

    if (tmpValue > 21) return 'bust';
    if (tmpValue == 21 && this.cards.length == 2) return 'blackjack';

    return tmpValue;
  }
}

export class Player extends Schema {
  @type('string') sessionId: string;
  @type('string') displayName: string;
  @type('number') money: number = 0;
  @type('number') bet: number = 10;
  @type('boolean') ready = false;
  @type(Hand) hand = new Hand();
}

export class GameState extends Schema {
  @type('string') roundState: 'idle' | 'dealing' | 'turns' | 'end' = 'idle';
  @type('string') currentTurnPlayerId: string;
  @type('uint64') currentTurnTimeoutTimestamp: number = 0;

  @type(Hand) dealerHand = new Hand();
  @type({ map: Player }) players = new MapSchema<Player>();
}
