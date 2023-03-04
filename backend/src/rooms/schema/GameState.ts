import { Schema, MapSchema, type, ArraySchema, filter } from '@colyseus/schema';
import gameConfig from '../../game.config';
import {
  availableSuits,
  availableValues,
  getRandomArrayItem,
} from './cardValues';

/**
 * Represents the value (suit and value) of a single card
 */
export class CardValue extends Schema {
  @type('string') suit: string;
  @type('string') value: string;

  public get numericValue() {
    if (this.value == 'A') return 11;
    if (isNaN(Number(this.value))) return 10;
    return Number(this.value);
  }
}

/**
 * Represents a single card
 */
export class Card extends Schema {
  @type('boolean') visible: boolean;

  @filter(function (this: Card) {
    return this.visible;
  })
  @type(CardValue)
  value?: CardValue;

  constructor(visible = true) {
    super();

    this.visible = visible;

    this.value = new CardValue({
      suit: getRandomArrayItem(availableSuits),
      value: getRandomArrayItem(availableValues),
    });
  }
}

/**
 * Represents a set of cards
 */
export class Hand extends Schema {
  @type('number') score: number;
  @type('boolean') isBlackjack: boolean = false;
  @type('boolean') isBusted: boolean = false;
  @type([Card]) cards = new ArraySchema<Card>();

  public addCard(visible?: boolean) {
    this.cards.push(new Card(visible));
    if (visible === false) this.clearScore();
    else this.calculateScore();
  }

  public clear() {
    this.cards.clear();
    this.clearScore();
  }

  private clearScore() {
    this.score = 0;
    this.isBlackjack = false;
    this.isBusted = false;
  }

  public calculateScore() {
    let tmpScore = this.cards
      .map((c) => c.value!.numericValue)
      .reduce((a, b) => a + b);

    let numberOfAces = this.cards.filter((c) => c.value!.value === 'A').length;
    while (numberOfAces > 0) {
      if (tmpScore > 21) {
        numberOfAces--;
        tmpScore -= 10;
      } else break;
    }

    this.score = tmpScore;
    this.isBlackjack = tmpScore == 21 && this.cards.length == 2;
    this.isBusted = tmpScore > 21;
  }
}

export class Player extends Schema {
  @type('string') sessionId: string;
  @type('string') displayName: string;
  @type('number') money: number = gameConfig.initialPlayerMoney;
  @type('number') bet: number = gameConfig.initialPlayerBet;
  @type('boolean') ready = false;
  @type('boolean') autoReady = false;
  @type('boolean') disconnected = false;
  @type('boolean') admin: boolean;
  @type('string') roundOutcome: roundOutcome;
  @type(Hand) hand = new Hand();
}

export class GameState extends Schema {
  @type('string') roundState: 'idle' | 'dealing' | 'turns' | 'end' = 'idle';
  @type('string') currentTurnPlayerId: string;
  @type('uint64') currentTurnTimeoutTimestamp: number = 0;
  @type('uint64') nextRoundStartTimestamp: number = 0;

  @type(Hand) dealerHand = new Hand();
  @type({ map: Player }) players = new MapSchema<Player>();
}

export type roundOutcome = 'bust' | 'win' | 'lose' | 'draw' | '';
