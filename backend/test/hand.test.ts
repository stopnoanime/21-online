import gameConfig from '../src/game.config';
import { CardValue, Hand } from '../src/rooms/schema/GameState';

describe('test hand class', () => {
  it('calculates single card value', async () => {
    const cardV = new CardValue({ value: 'A' });

    expect(cardV.numericValue).toBe(11);

    cardV.value = 'K';
    expect(cardV.numericValue).toBe(10);

    cardV.value = '7';
    expect(cardV.numericValue).toBe(7);
  });

  it('adds cards', async () => {
    const hand = new Hand();

    hand.addCard();

    expect(hand.cards.length).toBe(1);
    expect(hand.cards[0].value?.suit).toBeTruthy();
    expect(hand.cards[0].value?.value).toBeTruthy();
  });

  it('calculates hand score', async () => {
    const hand = new Hand();

    hand.addCard();
    hand.addCard();
    hand.addCard();

    //Score should be auto calculated
    expect(hand.score).toBeTruthy();

    hand.cards[0].value!.value = '2';
    hand.cards[1].value!.value = '3';
    hand.cards[2].value!.value = 'Q';
    hand.calculateScore();

    expect(hand.score).toBe(15);

    hand.cards[0].value!.value = '8';
    hand.cards[1].value!.value = '2';
    hand.cards[2].value!.value = 'A';
    hand.calculateScore();

    expect(hand.score).toBe(21);

    hand.cards[0].value!.value = 'A';
    hand.cards[1].value!.value = 'A';
    hand.cards[2].value!.value = 'A';
    hand.calculateScore();

    expect(hand.score).toBe(13);
  });

  it('clears hand', async () => {
    const hand = new Hand();

    hand.addCard();
    hand.clear();

    expect(hand.cards.length).toBe(0);
    expect(hand.score).toBe(0);
    expect(hand.isBlackjack).toBe(false);
    expect(hand.isBusted).toBe(false);
  });
});
