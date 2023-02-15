import { placePlayersAtTable } from './placePlayersAtTable';

describe('placePlayersAtTable', () => {
  it('should place players when there are less of them than max', () => {
    const unsortedPlayers = [
      { sessionId: 'abc' },
      { sessionId: 'qwe' },
      { sessionId: 'asd' },
    ];

    const result = placePlayersAtTable(unsortedPlayers as any, 'abc', 7);

    expect(result as any).toEqual([
      undefined,
      undefined,
      { sessionId: 'asd' },
      { sessionId: 'abc' },
      { sessionId: 'qwe' },
      undefined,
      undefined,
    ]);
  });

  it('should place players when there are as many as max', () => {
    const unsortedPlayers = [
      { sessionId: 'qwe' },
      { sessionId: 'asd' },
      { sessionId: 'abc' },
    ];

    const result = placePlayersAtTable(unsortedPlayers as any, 'abc', 3);

    expect(result as any).toEqual([
      { sessionId: 'asd' },
      { sessionId: 'abc' },
      { sessionId: 'qwe' },
    ]);
  });
});
