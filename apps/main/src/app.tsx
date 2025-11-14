import { useMemo } from 'react';
import { formatMessage } from '@project/common';
import { describeContract, demoContract } from '@project/contracts';
import { getDrizzleConfig } from '@project/drizzle';
import { createPonderConfig } from '@project/ponder-config';
import { handleRequest } from '@project/trpc';

export function App() {
  const message = useMemo(() => formatMessage('main app'), []);
  const contractMessage = useMemo(() => describeContract(demoContract), []);
  const databaseConfig = useMemo(() => getDrizzleConfig(), []);
  const ponderConfig = useMemo(() => createPonderConfig('local', [demoContract]), []);
  const rpcResponse = useMemo(() => handleRequest({ path: 'status' }), []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>{message}</h1>
      <section>
        <h2>Shared Libraries</h2>
        <ul>
          <li>{contractMessage}</li>
          <li>
            Database schema: <code>{databaseConfig.schema}</code>
          </li>
          <li>
            Ponder network: <code>{ponderConfig.network}</code>
          </li>
          <li>
            RPC message: <code>{rpcResponse.message}</code>
          </li>
        </ul>
      </section>
    </main>
  );
}
