import { Alchemy, Network } from "alchemy-sdk";

const ENS_ADDRESS = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";

const config = {
  apiKey: process.env.ALCHEMY_KEY,
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(config);

export async function getEnsName(address) {
  // return the first ens name that we can find
  const nfts = await alchemy.nft.getNftsForOwner(address, {
    contractAddresses: [ENS_ADDRESS],
  });

  try {
    return nfts.ownedNfts[0].title;
  } catch (e) {
    return "";
  }
}
