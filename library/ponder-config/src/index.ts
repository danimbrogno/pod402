import { ContractDefinition } from '@project/contracts';

type Network = 'local' | 'testnet' | 'mainnet';

export interface PonderConfig {
  network: Network;
  contracts: ContractDefinition[];
}

export function createPonderConfig(network: Network, contracts: ContractDefinition[]): PonderConfig {
  return { network, contracts };
}
