import { createClient } from "@supabase/supabase-js";
import Web3 from "web3";
import Contract from "web3-eth-contract";
import dNFT_ABI from "./abi/dNFT.json" assert { type: "json" };
import * as dotenv from "dotenv";
import { sleep } from "./utils/sleep.js";
import { getEnsName } from "./utils/ensName.js";
dotenv.config();

const SYNC_LOG_SIGNATURE =
  "0xff14d8520387b9b85d2a017dc41ae15db04a22d4c67deac04eb45048631ffa86";

const TIME_BETWEEN_NFT_INSERTIONS = 10; // ms

const supabase = createClient(
  process.env.MODE === "DEV"
    ? process.env.SUPABASE_URL_DEV
    : process.env.SUPABASE_URL_PROD,
  process.env.MODE === "DEV"
    ? process.env.SUPABASE_KEY_DEV
    : process.env.SUPABASE_KEY_PROD
);

var web3 = new Web3(process.env.INFURA_RPC);
Contract.setProvider(process.env.INFURA_RPC);

const dNftContract = new Contract(dNFT_ABI["abi"], process.env.dNFT_ADDRESS);

/**
 * Get the dNFT with the given index and insert it into the nfts table.
 * @param {i} index from 0 to totalSupply
 * @param {nextVersion} version of the sync
 */
async function insertNft(tokenId, nextVersion) {
  console.log(tokenId);

  const nft = await dNftContract.methods.idToNft(tokenId).call();
  const owner = await dNftContract.methods.ownerOf(tokenId).call();

  const _nft = {
    xp: nft.xp,
    deposit: nft.deposit,
    withdrawn: nft.withdrawn,
    tokenId: tokenId,
    owner: owner,
    contractAddress: process.env.dNFT_ADDRESS,
    version_id: nextVersion,
  };

  console.log(`insert ${tokenId}`);
  const { error } = await supabase.from("nfts").insert(_nft);
  console.log("insert", error);
}

async function getLastVersion() {
  let lastVersion = await supabase
    .from("versions")
    .select("version")
    .order("version", {
      ascending: false,
    })
    .limit(1);

  try {
    return lastVersion.data[0].version;
  } catch {
    return 0;
  }
}

async function insertNextVersion(nextVersion, syncId) {
  console.log(`inserting next version: ${nextVersion}`);
  const { error } = await supabase.from("versions").insert({
    version: nextVersion,
    contractAddress: process.env.dNFT_ADDRESS,
    mode: process.env.MODE,
    sync_id: syncId,
  });
  console.log(error);
}

async function upsertEns() {
  const lastVersion = await getLastVersion();

  const { data } = await supabase
    .from("nfts")
    .select("*")
    .eq("version_id", lastVersion);

  const owners = data.map((nft) => nft.owner);
  const ensNames = await getEnsName(owners);

  const ensObjects = owners.map((owner, i) => {
    return {
      address: owner,
      ens: ensNames[i],
    };
  });

  const { error } = await supabase.from("ens").upsert(ensObjects, {});
  console.log("upsertEns error:", error);
}

/**
 * Get all dNFTs for this sync version and insert them into the nfts table.
 */
async function insertNfts(event) {
  const lastVersion = await getLastVersion();
  const nextVersion = lastVersion + 1;

  const syncId = parseEvent(event).syncId;
  insertNextVersion(nextVersion, syncId);

  const totalSupply = await dNftContract.methods.totalSupply().call();

  for (let i = 0; i < totalSupply; i++) {
    // without this supabase will throw an error, because of too many requests
    await sleep(TIME_BETWEEN_NFT_INSERTIONS);
    insertNft(i, nextVersion);
  }
}

function parseEvent(event) {
  return {
    syncId: parseInt(event["data"]),
  };
}

/**
 * Listen to sync events. If a sync event is emitted, get all dNFTs and insert
 * them into the nfts table.
 */
function subscribeToSync() {
  console.log("subscribing to sync");
  web3.eth.subscribe(
    "logs",
    {
      address: process.env.dNFT_ADDRESS,
      topics: [SYNC_LOG_SIGNATURE],
    },
    (_, event) => {
      insertNfts(event);
      // upsertEns();
    }
  );
}

subscribeToSync();
