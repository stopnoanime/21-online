import gameConfig from '../game.config';
import { animals, colors } from './namesDictionary';
import { uniqueNamesGenerator } from 'unique-names-generator';
import { Hand, roundOutcome } from './schema/GameState';

/**
 * Generates a random uppercase string with length of `gameConfig.roomIdLength`
 * @returns the string
 */
export function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < gameConfig.roomIdLength; i++)
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

/**
 * Generates a random username
 * @returns the username
 */
export function generateUserName(): string {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: ' ',
    style: 'capital',
  });
}

/**
 * Given two hands and bet, calculates if player won/lost, and the amount they won
 * @param playerHand The player's hand
 * @param dealerHand The dealer's hand
 * @param bet The player's bet
 * @returns The outcome
 */
export function computeRoundOutcome(
  playerHand: Hand,
  dealerHand: Hand,
  bet: number
): {
  moneyChange: number;
  outcome: roundOutcome;
} {
  if (playerHand.isBlackjack && !dealerHand.isBlackjack) {
    // Player wins 3:2
    return {
      moneyChange: (5 / 2) * bet,
      outcome: 'win',
    };
  } else if (
    dealerHand.isBusted || //dealer busted, player wins
    playerHand.score > dealerHand.score // player has higher score than dealer, player wins
  ) {
    return {
      moneyChange: 2 * bet,
      outcome: 'win',
    };
  } else if (
    playerHand.score == dealerHand.score && //Score is the same
    playerHand.isBlackjack == dealerHand.isBlackjack //And dealer does not have blackjack if player also doesn't have it
  ) {
    return {
      moneyChange: bet,
      outcome: 'draw',
    };
  } else {
    return {
      moneyChange: 0,
      outcome: 'lose',
    };
  }
}
