import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'rocket-pool';
export const version = '0.1.3';

// Holesky
const rocketNetworkVotingAddress = '0x76caB8828324ba4ad32Eb1140057A485606aa791';
const rocketNetworkVotingAbi = ['function getVotingPower(address, uint32) external view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const votingPower = new Multicaller(network, provider, rocketNetworkVotingAbi, { blockTag });
  addresses.forEach((address) =>
    votingPower.call(address, rocketNetworkVotingAddress, 'getVotingPower', [address, blockTag])
  );

  const result: Record<string, BigNumberish> = await votingPower.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
