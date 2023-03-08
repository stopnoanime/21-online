import {
  placePlayersAtMobileTable,
  placePlayersAtTable,
} from './placePlayersAtTable';

describe('placePlayersAtTable', () => {
  it('should sort players when there is less of them than tableSize', () => {
    const unsortedPlayers = [
      { sessionId: 'playerId' },
      { sessionId: '1' },
      { sessionId: '2' },
    ];

    const result = placePlayersAtTable(unsortedPlayers as any, 'playerId', 7);

    expect(result as any).toEqual([
      undefined,
      undefined,
      { sessionId: '2' },
      { sessionId: 'playerId' },
      { sessionId: '1' },
      undefined,
      undefined,
    ]);
  });

  it('should sort players when there is as many of them as tableSize', () => {
    const unsortedPlayers = [
      { sessionId: '1' },
      { sessionId: '2' },
      { sessionId: 'playerId' },
    ];

    const result = placePlayersAtTable(unsortedPlayers as any, 'playerId', 3);

    expect(result as any).toEqual([
      { sessionId: '2' },
      { sessionId: 'playerId' },
      { sessionId: '1' },
    ]);
  });
});

describe('placePlayersAtMobileTable', () => {
  it('should sort players when there is less of them than tableSize', () => {
    const unsortedPlayers = [
      { sessionId: '1' },
      { sessionId: 'playerId' },
      { sessionId: '2' },
    ];

    const result = placePlayersAtMobileTable(
      unsortedPlayers as any,
      'playerId',
      7
    );

    expect(result as any).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      { sessionId: '1' },
      { sessionId: '2' },
      { sessionId: 'playerId' },
    ]);
  });

  it('should sort players when there is as many of them as tableSize', () => {
    const unsortedPlayers = [
      { sessionId: '1' },
      { sessionId: '2' },
      { sessionId: 'playerId' },
    ];

    const result = placePlayersAtMobileTable(
      unsortedPlayers as any,
      'playerId',
      3
    );

    expect(result as any).toEqual([
      { sessionId: '2' },
      { sessionId: '1' },
      { sessionId: 'playerId' },
    ]);
  });
});
