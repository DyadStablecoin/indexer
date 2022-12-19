import { createClient } from "@supabase/supabase-js";
import Web3 from "web3";
import Contract from "web3-eth-contract";
import dNFT_ABI from "./abi/dNFT.json" assert { type: "json" };
import * as dotenv from "dotenv";
import { getEnsName } from "./utils.js";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

var web3 = new Web3(process.env.INFURA_RPC);
Contract.setProvider(process.env.INFURA_RPC);

const dNftContract = new Contract(dNFT_ABI["abi"], process.env.dNFT_ADDRESS);

/**
 * Upsert (update if exists or insert if not) a single NFT
 * @param {i} index from 0 to totalSupply
 * @param {newVersion} version of the sync
 */
async function upsertNft(i, newVersion) {
  console.log(i);

  const tokenId = await dNftContract.methods.tokenByIndex(i).call();
  const nft = await dNftContract.methods.idToNft(tokenId).call();
  const owner = await dNftContract.methods.ownerOf(tokenId).call();

  const _nft = {
    id: tokenId,
    xp: nft.xp,
    deposit: nft.deposit,
    withdrawan: nft.withdrawan,
    owner: owner,
    contractAddress: process.env.dNFT_ADDRESS,
    version: newVersion,
  };

  console.log(`upsert ${tokenId}`);
  const { error } = await supabase.from("nfts").upsert(_nft);
  console.log(error);
}

/**
 *
 */
async function getNewVersion() {
  let oldVersion = await supabase
    .from("nfts")
    .select("version")
    .limit(1)
    .order("version", {
      ascending: false,
    });

  return oldVersion.data[0].version + 1;
}

/**
 * Upsert all NFTs from 0 to totalSupply
 */
async function upsertNfts() {
  const newVersion = await getNewVersion();
  console.log(`new version: ${newVersion}`);

  const totalSupply = await dNftContract.methods.totalSupply().call();

  for (let i = 0; i < totalSupply; i++) {
    upsertNft(i, newVersion);
  }
}

async function insertSyncEvent() {
  console.log("inserting sync event");
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
      upsertNfts();
      insertSyncEvent();

      if (!error) console.log(result);
    }
  );
}

upsertNfts();
subscribeToSync();
