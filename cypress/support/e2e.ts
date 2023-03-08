// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// When a command from ./commands is ready to use, import with `import './commands'` syntax
// import './commands';

import * as Colyseus from 'colyseus.js';
import { environment } from '../../src/environments/environment.development';

export const client = new Colyseus.Client(environment.gameServer);

declare global {
  namespace Cypress {
    interface Chainable {
      getBySel: (selector: string) => Chainable;
      createRoom: () => Chainable<Colyseus.Room>;
      joinRoom: (id: string) => Chainable<Colyseus.Room>;
      startRoundWithoutBlackjack: () => Chainable;
      getClipboard: () => Chainable<string>;
    }
  }
}

Cypress.Commands.add('getBySel', (selector: string) => {
  return cy.get(`[data-cy=${selector}]`);
});

Cypress.Commands.add('createRoom', () => {
  return cy.wrap(client.create('gameRoom'));
});

Cypress.Commands.add('joinRoom', (id: string) => {
  return cy.wrap(client.joinById(id));
});

Cypress.Commands.add('getClipboard', () => {
  return cy.window().then((w) => w.navigator.clipboard.readText());
});

Cypress.Commands.add('startRoundWithoutBlackjack', () => {
  cy.visit('/');
  cy.getBySel('create-btn').click();
  cy.contains('Ready').click();
  cy.getBySel('roundStart-popup');

  return cy.get('app-hand-score > div').then((e) => {
    if (e.text().trim() == 'Blackjack') {
      cy.log('Player got blackjack, reloading');
      cy.clearLocalStorage();
      cy.reload();

      return cy.startRoundWithoutBlackjack();
    }

    return true;
  });
});
