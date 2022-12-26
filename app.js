import { createClient } from "@supabase/supabase-js";
import Web3 from "web3";
import Contract from "web3-eth-contract";
import dNFT_ABI from "./abi/dNFT.json" assert { type: "json" };
import { getEnsName } from "./utils/ensName.js";
import * as dotenv from "dotenv";
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

async function insertLatestVersion(newVersion) {
  console.log("inserting latest version");
  const { error } = await supabase.from("versions").insert({
    version: newVersion,
    contractAddress: process.env.dNFT_ADDRESS,
    mode: process.env.MODE,
  });
  console.log(error);
}

/**
 * Upsert all NFTs from 0 to totalSupply
 */
async function upsertNfts() {
  const lastVersion = await getLastVersion();
  const newVersion = lastVersion + 1;
  console.log(`new version: ${newVersion}`);

  const totalSupply = await dNftContract.methods.totalSupply().call();

  for (let i = 0; i < totalSupply; i++) {
    // without this supabase will throw an error, because of too many requests
    await new Promise((resolve) => setTimeout(resolve, 10));
    upsertNft(i, newVersion);
  }

  insertLatestVersion(newVersion);
}

/**
 * Get the ens names of all NFT owners and store them in the nfts table
 */
async function upsertEnsNames() {
  console.log("upserting ens names");
  let nfts = await supabase.from("nfts").select("id, owner");

  let owners = [];
  nfts.data.map((nft) => {
    owners.push(nft.owner);
  });
  let ensNames = await getEnsName(owners);

  let ids2EnsName = [];
  ensNames.map((ensName, i) => {
    ids2EnsName.push({
      id: nfts.data[i].id,
      ensName: ensName,
    });
  });

  const { error } = await supabase.from("nfts").upsert(ids2EnsName);
  console.log(error);
}

/**
 * listen to sync events and upsert all NFTs
 */
function subscribeToSync() {
  console.log("subscribing to sync");
  web3.eth.subscribe(
    "logs",
    {
      address: process.env.dNFT_ADDRESS,
      topics: [
        "0xff14d8520387b9b85d2a017dc41ae15db04a22d4c67deac04eb45048631ffa86",
      ],
    },
    function (error, result) {
      upsertNfts();
      upsertEnsNames();

      if (!error) console.log(result);
    }
  );
}

upsertNfts();
subscribeToSync();
