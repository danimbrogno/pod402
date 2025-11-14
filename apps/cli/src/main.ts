import { formatMessage } from '@project/common';
import { describeContract, demoContract } from '@project/contracts';
import { getDrizzleConfig } from '@project/drizzle';
import { createPonderConfig } from '@project/ponder-config';

function main() {
  const greeting = formatMessage('cli');
  const contractSummary = describeContract();
  const database = getDrizzleConfig();
  const ponder = createPonderConfig('local', [demoContract]);

  console.log(greeting);
  console.log(contractSummary);
  console.log('Database configuration:', database);
  console.log('Ponder configuration:', ponder);
}

main();
