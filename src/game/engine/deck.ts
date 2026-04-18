import { Card, Rank, Suit } from '../types';
import _ from 'lodash';

export const createDeck = (): Card[] => {
  const suits: Suit[] = ['h', 'd', 'c', 's'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  return _.shuffle(deck);
};
