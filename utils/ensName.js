import Contract from "web3-eth-contract";
import * as dotenv from "dotenv";
dotenv.config();

// we need the mainnet provider here, because the ENS registry is on mainnet!
Contract.setProvider(process.env.INFURA_RPC.replace("goerli", "mainnet"));

const RESOLVER_ABI = [
  {
    inputs: [
      { internalType: "address[]", name: "addresses", type: "address[]" },
    ],
    name: "getNames",
    outputs: [{ internalType: "string[]", name: "r", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
];

const RESOLVER_ADDRESS = "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C";
const ensContract = new Contract(RESOLVER_ABI, RESOLVER_ADDRESS);

export async function getEnsName(addresses) {
  const res = await ensContract.methods.getNames(addresses).call();
  return res;
}
