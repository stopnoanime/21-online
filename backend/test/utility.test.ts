import gameConfig from '../src/game.config';
import { Hand } from '../src/rooms/schema/GameState';
import {
  computeRoundOutcome,
  generateRoomId,
  generateUserName,
} from '../src/rooms/utility';

describe('test utility functions', () => {
  it('generates room id', async () => {
    const id = generateRoomId();

    expect(typeof id).toBe('string');
    expect(id.length).toBe(gameConfig.roomIdLength);
  });

  it('generates username', async () => {
    const id = generateUserName();

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('computes roundOutcome - blackjack', async () => {
    const player = new Hand();
    const dealer = new Hand();

    player.isBlackjack = true;

    let outcome = computeRoundOutcome(player, dealer, 1);

    expect(outcome.moneyChange).toBe(5 / 2);
    expect(outcome.outcome).toBe('win');
  });

  it('computes roundOutcome - win', async () => {
    const player = new Hand();
    const dealer = new Hand();

    dealer.isBusted = true;

    let outcome = computeRoundOutcome(player, dealer, 1);

    expect(outcome.moneyChange).toBe(2);
    expect(outcome.outcome).toBe('win');

    dealer.isBusted = false;
    player.score = 20;
    dealer.score = 15;

    outcome = computeRoundOutcome(player, dealer, 1);

    expect(outcome.moneyChange).toBe(2);
    expect(outcome.outcome).toBe('win');
  });

  it('computes roundOutcome - draw', async () => {
    const player = new Hand();
    const dealer = new Hand();

    player.score = 21;
    dealer.score = 21;

    let outcome = computeRoundOutcome(player, dealer, 1);

    expect(outcome.moneyChange).toBe(1);
    expect(outcome.outcome).toBe('draw');

    player.isBlackjack = true;
    dealer.isBlackjack = true;

    outcome = computeRoundOutcome(player, dealer, 1);

    expect(outcome.moneyChange).toBe(1);
    expect(outcome.outcome).toBe('draw');
  });

  it('computes roundOutcome - lose', async () => {
    const player = new Hand();
    const dealer = new Hand();

    player.score = 10;
    dealer.score = 21;

    let outcome = computeRoundOutcome(player, dealer, 1);

    expect(outcome.moneyChange).toBe(0);
    expect(outcome.outcome).toBe('lose');

    //Player should also lose if dealer has same score, but also blackjack
    player.score = 21;
    dealer.score = 21;
    dealer.isBlackjack = true;

    outcome = computeRoundOutcome(player, dealer, 1);

    expect(outcome.moneyChange).toBe(0);
    expect(outcome.outcome).toBe('lose');
  });
});
