export const availableSuits = ['♠︎', '♥︎', '♣︎', '♦︎'];
export const availableValues = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

export function getRandomArrayItem<Type>(arr: Type[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
