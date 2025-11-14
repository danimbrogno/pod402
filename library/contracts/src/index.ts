import { formatMessage } from '@project/common';

export interface ContractDefinition {
  name: string;
  address: string;
  network: string;
}

export const demoContract: ContractDefinition = {
  name: 'DemoContract',
  address: '0x0000000000000000000000000000000000000000',
  network: 'local'
};

export function describeContract(definition: ContractDefinition = demoContract): string {
  return formatMessage(`contract ${definition.name} on ${definition.network}`);
}
