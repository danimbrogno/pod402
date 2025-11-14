import { describeContract, demoContract } from '@project/contracts';
import { createPonderConfig } from '@project/ponder-config';
import { handleRequest } from '@project/trpc';

function bootstrap() {
  const ponder = createPonderConfig('local', [demoContract]);
  const contractInfo = describeContract(demoContract);
  const rpcStatus = handleRequest({ path: 'subgraph.status' });

  console.log('Subgraph bootstrap complete.');
  console.log('Configured network:', ponder.network);
  console.log('Loaded contract:', contractInfo);
  console.log('RPC status:', rpcStatus.message);
}

bootstrap();
