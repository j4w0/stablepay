import concurrently from 'concurrently';
const { result } = concurrently(
  [
    {
      command: 'cd apps/client/web && bun dev',
      name: 'Client:Web',
      prefixColor: 'yellow',
    },
    {
      command: 'cd apps/merchant/web && bun dev',
      name: 'Merchant:Web',
      prefixColor: 'cyan',
    },
    {
      command: 'cd apps/server && bun dev',
      name: 'ApiServer',
      prefixColor: 'green',
    },
  ],
  {
    killOthersOn: ['failure', 'success'],
    restartTries: 3,
  },
);
await result;
