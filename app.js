import { createClient } from "@supabase/supabase-js";
import Web3 from "web3";
import Contract from "web3-eth-contract";
import dNFT_ABI from "./abi/dNFT.json" assert { type: "json" };
import { Alchemy, Network } from "alchemy-sdk";
import * as dotenv from "dotenv";
dotenv.config();

const config = {
  apiKey: process.env.ALCHEMY_KEY,
  network: Network.ETH_MAINNET,
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

var web3 = new Web3(process.env.INFURA_RPC);
Contract.setProvider(process.env.INFURA_RPC);

const alchemy = new Alchemy(config);

const ENS_ADDRESS = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";

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

async function refreshNftTable() {
  var contract = new Contract(dNFT_ABI["abi"], process.env.dNFT_ADDRESS);
  const totalSupply = await contract.methods.totalSupply().call();

  let nfts = [];

  for (let i = 0; i < totalSupply; i++) {
    console.log(`Fetching NFT ${i} of ${totalSupply}`);
    const tokenId = await contract.methods.tokenByIndex(i).call();
    const nft = await contract.methods.idToNft(tokenId).call();
    const owner = await contract.methods.ownerOf(tokenId).call();
    const ensName = await getEnsName(owner);

    nfts.push({
      id: tokenId,
      xp: nft.xp,
      withdrawn: nft.withdrawn,
      deposit: nft.deposit,
      owner: owner,
      ensName: ensName,
      contractAddress: process.env.dNFT_ADDRESS,
    });
  }

  const { error } = await supabase.from("nfts").upsert(nfts);
}

async function pushSyncEvent() {
  console.log("pushing sync event");
  const { error } = await supabase.from("sync").insert({
    contractAddress: process.env.dNFT_ADDRESS,
    mode: process.env.MODE,
  });
  console.log(error);
}

function subscribeToSync() {
  console.log("subscribing to sync");
  web3.eth.subscribe(
    "logs",
    {
      address: process.env.POOL_ADDRESS,
      topics: [
        "0xff14d8520387b9b85d2a017dc41ae15db04a22d4c67deac04eb45048631ffa86",
      ],
    },
    function (error, result) {
      refreshNftTable();
      pushSyncEvent();

      if (!error) console.log(result);
    }
  );
}

refreshNftTable();
subscribeToSync();
