export default {
  maxClients: 7,
  roomIdLength: 4,

  //All times are in ms
  inactivityTimeout: 30000,
  delayedRoundStartTime: 3000,
  roundStateDealingTime: 1000,
  dealerCardDelay: 1000,
  roundOutcomeDelay: 2000,
  roundStateEndTime: 5000,

  minBet: 1,
  maxBet: 1000,
  initialPlayerMoney: 10000,
  initialPlayerBet: 50,

  // Websocket Code when player is disconnected by server
  kickCode: 4000,
  roomFullCode: 4444,
};
