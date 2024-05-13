import { Multicaller } from '../../utils';
import { strategy as rocketpoolNodeOperatorv4 } from '../rocketpool-node-operator-v4';

export const author = 'rocket-pool';
export const version = '0.1.4';

// Holesky
const rocketNetworkVotingAddress = '0x76caB8828324ba4ad32Eb1140057A485606aa791';
const rocketNetworkVotingAbi = ['function getCurrentDelegate(address) external view returns (address);'];

// Mapping Contract
const rocketDelegateMappingAddress = '0x76caB8828324ba4ad32Eb1140057A485606aa791';
const rocketDelegateMappingAbi = ['function getNodeAddress(address) external view returns (address);'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const signingDelegations = new Multicaller(network, provider, rocketDelegateMappingAbi, { blockTag });
  addresses.forEach((address) =>
    signingDelegations.call(address, rocketDelegateMappingAddress, 'getNodeAddress', [address])
  );
  const nodeAddresses = await signingDelegations.execute();
  if (Object.keys(nodeAddresses).length === 0) return {};

  const delegations = new Multicaller(network, provider, rocketNetworkVotingAbi, { blockTag });
  nodeAddresses.forEach((nodeAddress) =>
    delegations.call(nodeAddress, rocketNetworkVotingAddress, 'getCurrentDelegate', [nodeAddress])
  );
  const delegationsResponse = await delegations.execute();
  if (Object.keys(delegationsResponse).length === 0) return {};

  const score = await rocketpoolNodeOperatorv4(
    space,
    network,
    provider,
    delegationsResponse,
    options,
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce((a, b) => a + score[b], 0)
        : 0;
      return [address, addressScore];
    })
  );
}
