import gameConfig from 'backend/src/game.config';

describe('21-online tests', () => {
  it('visits the login page', () => {
    cy.visit('/');

    cy.title().should('equal', '21 Online');
  });

  it('can create a room', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    cy.get('app-game-screen').should('exist');
    cy.get('app-player-actions').should('exist');
  });

  it('can join a room by ID and it displays room data', () => {
    cy.createRoom().then((r) => {
      cy.visit('/');

      cy.getBySel('roomId-input').type(r.id);
      cy.getBySel('join-btn').click();

      cy.get('app-game-screen').should('exist');

      //It changes url when joining room
      cy.location('pathname').should('equal', `/room/${r.id}`);
      cy.location('search').should('include', '?session=');

      //Display room id at bottom of page
      cy.getBySel('roomId-value').should('contain', r.id);
    });
  });

  it('can join a room with URL', () => {
    cy.createRoom().then((r) => {
      cy.visit(`/room/${r.id}`);

      cy.get('app-game-screen').should('exist');
    });
  });

  it('copies room URL to clipboard on click', () => {
    cy.createRoom().then((r) => {
      cy.visit(`/room/${r.id}`);

      cy.contains('button', 'link').click();

      cy.url().then((u) => {
        cy.getClipboard().should('eq', u.split('?')[0]);
      });
    });
  });

  it('redirects to main page on bad URL', () => {
    cy.visit(`/room/bad?session=bad`);

    cy.location('pathname').should('equal', '/');

    cy.visit(`/room/bad`);

    cy.location('pathname').should('equal', '/');

    cy.visit(`/bad`);

    cy.location('pathname').should('equal', '/');
  });

  it('reconnects to room after reload', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    cy.get('app-game-screen').should('exist');

    cy.reload();

    cy.get('app-game-screen').should('not.exist');
    cy.get('app-game-screen').should('exist');
  });

  it('reconnects to room after going to main page', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    cy.get('app-game-screen').should('exist');

    cy.visit(`/`);

    cy.get('app-game-screen').should('not.exist');
    cy.get('app-game-screen').should('exist');
  });

  it('can exit room using button', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    cy.contains('button', 'logout').click();

    cy.location('pathname').should('equal', '/');
    cy.get('app-game-screen').should('not.exist');
  });

  it('can exit room using navigation button', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    //wait for game screen to load before going back
    cy.get('app-game-screen').should('exist').go('back');

    cy.location('pathname').should('equal', '/');
    cy.get('app-game-screen').should('not.exist');
  });

  it('shows if player is admin', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    cy.contains('button', 'star').should('exist');

    //Second player should not be admin
    cy.createRoom().then((r) => {
      cy.visit(`/room/${r.id}`);

      //wait for game screen to load before checking for admin star existence
      cy.get('app-game-screen').should('exist');
      cy.contains('button', 'star').should('not.exist');
    });
  });

  it('renders player', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    cy.getBySel('player').should('have.length', 1);
    cy.getBySel('player-name').invoke('text').should('not.be.empty');
    cy.getBySel('player').contains(gameConfig.initialPlayerMoney + ' $');

    //Turn progress bar should be at zero
    cy.getBySel('turn-progress-bar')
      .invoke('attr', 'aria-valuenow')
      .should('eq', '0');
  });

  it('renders other players', () => {
    cy.createRoom().then((r) => {
      cy.visit(`/room/${r.id}`);

      cy.getBySel('player').should('have.length', 2);
    });
  });

  it('can kick other players', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    //Get roomId and connect another client to it
    cy.location('pathname')
      .should('include', `/room/`)
      .then((p) => p.split('/')[2])
      .then((id) => cy.joinRoom(id));

    cy.getBySel('player')
      .should('have.length', 2)
      .last()
      .contains('button', 'close')
      .click({ force: true });

    cy.getBySel('player').should('have.length', 1);
  });

  it('displays kick dialog on kick', () => {
    cy.createRoom().then((r) => {
      cy.visit(`/room/${r.id}`);

      //After player is connected, kick them
      cy.location('search')
        .should('include', '?session=')
        .then((p) => p.split('=')[1])
        .then((session) => {
          r.send('kick', session);

          cy.get('app-kick-dialog');
        });
    });
  });

  it('can change bet using number input', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    cy.getBySel('bet-input').clear().type('222');
    cy.getBySel('setBet-btn').click();
    cy.getBySel('bet-value').should('have.text', '222');
  });

  it('can change bet using buttons', () => {
    cy.visit('/');
    cy.getBySel('create-btn').click();

    cy.get('app-player-actions').contains('- 10').click();
    cy.getBySel('bet-value').should(
      'have.text',
      gameConfig.initialPlayerBet - 10
    );
  });

  it('can start round', () => {
    cy.startRoundWithoutBlackjack();

    //Player should be highlighted
    cy.getBySel('player').should('have.class', 'primary-border');

    //Turn progress bar should be at 100%
    cy.getBySel('turn-progress-bar')
      .invoke('attr', 'aria-valuenow')
      .then(parseFloat)
      .should('be.greaterThan', 90);

    //Money should be taken from player after starting round
    cy.getBySel('player').contains(
      gameConfig.initialPlayerMoney - gameConfig.initialPlayerBet + ' $'
    );

    //Both player and dealer should have 2 cards, so 4 in total
    cy.get('app-card').should('have.length', 4);
  });

  it('player can hit during round', () => {
    cy.startRoundWithoutBlackjack();

    cy.contains('Hit').click();

    //Player should have 3 cards and dealer has 2 cards, so 5 in total
    cy.get('app-card').should('have.length', 5);
  });

  it(
    'player can stay during round and it cleanups table after round',
    {
      defaultCommandTimeout: 10000, //End phase can last longer than 4s
    },
    () => {
      cy.startRoundWithoutBlackjack();

      cy.contains('Stay').click();

      cy.getBySel('roundOutcome');

      // Cards should be cleaned up after round
      cy.get('app-card').should('have.length', 0);

      // Turn progress bar should be at 0%
      cy.getBySel('turn-progress-bar')
        .invoke('attr', 'aria-valuenow')
        .should('eq', '0');

      // Ready state should be unset
      cy.contains('Ready');
    }
  );

  it('shows when other players disconnected', () => {
    cy.createRoom().then((r) => {
      cy.visit(`/room/${r.id}`);

      cy.contains('Ready').click();
      r.send('ready', true);

      //Wait until cards are dealt -> round is started
      cy.get('app-card')
        .should('have.length', 6)
        .then((_) => {
          //Leave other client
          r.leave(false);

          //Check if disconnected popup was shown
          cy.contains('mat-icon', 'warning').should('exist');
        });
    });
  });
});
