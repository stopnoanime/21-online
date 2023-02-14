import { sortPlayers } from './sortPlayers';

describe('sortPlayers', () => {
  it('should sort players when there are less of them than max', () => {
    const unsortedPlayers = [
      { sessionId: 'abc' },
      { sessionId: 'qwe' },
      { sessionId: 'asd' },
    ];

    const result = sortPlayers(unsortedPlayers as any, 'abc', 7);

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

  it('should sort players when there are as many as max', () => {
    const unsortedPlayers = [
      { sessionId: 'qwe' },
      { sessionId: 'asd' },
      { sessionId: 'abc' },
    ];

    const result = sortPlayers(unsortedPlayers as any, 'abc', 3);

    expect(result as any).toEqual([
      { sessionId: 'asd' },
      { sessionId: 'abc' },
      { sessionId: 'qwe' },
    ]);
  });
});
