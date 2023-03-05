import { client } from "cypress/support/e2e"
import gameConfig from 'backend/src/game.config';

describe('21-online tests', () => {
  it('visits the login page', () => {
    cy.visit('/')

    cy.title().should('equal', '21 Online')
  })

  it('can create a room', () => {
    cy.visit('/')

    cy.contains('Create room').click();
    
    cy.get('app-game-screen').should('exist');
  })

  it('can join a room by ID', () => {
    cy.then(async () => {
      const  roomId = (await client.create('gameRoom')).id

      cy.visit('/')

      cy.contains('mat-form-field', 'Room ID').find('input').type(roomId);
      cy.contains('Join room').click();

      cy.get('app-game-screen').should('exist');
      cy.url().should('include', `/room/${roomId}`); 
    })
  })

  it('can join a room with URL', () => {
    cy.then(async () => {
      const  roomId = (await client.create('gameRoom')).id

      cy.visit(`/room/${roomId}`)

      cy.get('app-game-screen').should('exist');
    })
  })

  it('can exit room', () => {
    cy.visit('/')
    cy.contains('Create room').click();
    
    cy.contains('button','logout').click();
    cy.location('pathname').should('equal', '/')
  })

  it('renders other players', () => {
    cy.then(async () => {
      const room = await client.create('gameRoom');
      cy.visit(`/room/${room.id}`);

      cy.get('.player-holder').children().not(':contains("No Player")').not(':contains("Dealer")').should('have.length', 2)
    })
  })

  it('can kick other players', () => {
    cy.visit('/')
    cy.contains('Create room').click();

    cy.location('pathname').should('include', `/room/`).then(async p => {
      const roomId = p.split('/')[2];
      await client.joinById(roomId);

      cy.get('.player-holder').children().not(':contains("No Player")').not(':contains("Dealer")').should('have.length', 2).last().contains('button','close').click({force: true});

      cy.get('.player-holder').children().not(':contains("No Player")').not(':contains("Dealer")').should('have.length', 1);
    })
  })

  it('can change bet using number input', () => {
    cy.visit('/')
    cy.contains('Create room').click();

    cy.get('app-player-actions').find('input[type="number"]').clear().type('222');
    cy.get('app-player-actions').contains('Set Bet').click();
    cy.get('app-player-actions').contains('Current Bet:').find('span').should('have.text', '222');
  })

  it('can change bet using buttons', () => {
    cy.visit('/')
    cy.contains('Create room').click();

    cy.get('app-player-actions').contains('- 10').click();
    cy.get('app-player-actions').contains('Current Bet:').find('span').should('have.text', gameConfig.initialPlayerBet - 10);
  })

  it('can start round', {
    // Test can fail if player gets blackjack
    retries: {
      openMode: 2,
      runMode: 2,
    }
  }, () => {
    cy.visit('/')
    cy.contains('Create room').click();

    cy.contains('Ready').click();

    cy.contains('Starting round');

    //Player should be highlighted
    cy.get('.player-holder').children().not(':contains("No Player")').last().find('.primary-border');

    //Money should be taken from player after starting round
    cy.get('app-money-counter').contains(gameConfig.initialPlayerMoney - gameConfig.initialPlayerBet +  ' $');

    //Both player and dealer should have 2 cards, so 4 in total
    cy.get('app-card').should('have.length', 4)
  })

  it('can hit', {
    // Test can fail if player gets blackjack
    retries: {
      openMode: 2,
      runMode: 2,
    }
  }, () => {
    cy.visit('/')
    cy.contains('Create room').click();

    cy.contains('Ready').click();
    cy.contains('Hit').click();

    //Player should have 3 cards and dealer has 2 cards, so 5 in total
    cy.get('app-card').should('have.length', 5)
  })

  it('can play round',{
    defaultCommandTimeout: 10000,
    // Test can fail if player gets blackjack
    retries: {
      openMode: 2,
      runMode: 2,
    }
  }, () => {
    cy.visit('/')
    cy.contains('Create room').click();

    cy.contains('Ready').click();
    cy.contains('Stay').click();

    cy.get('#roundOutcome');
    cy.get('app-card').should('have.length', 0);
    cy.contains('Ready');
  })
})
