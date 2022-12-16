import { createClient } from "@supabase/supabase-js";
import Web3 from "web3";
// import web3 from "web3-eth";
import Contract from "web3-eth-contract";
import dNFT_ABI from "./abi/dNFT.json" assert { type: "json" };
import * as dotenv from "dotenv";
dotenv.config();

const dNFT = "0x2544bA4Bc4A1d4Eb834a2770Fd5B52bAfa500B44";
const POOL = "0xC98D30Cf8837dE6ae019D37084f1893751D47C4E";
const INFURA = `wss://goerli.infura.io/ws/v3/${process.env.GOERLI_INFURA_PROJECT_ID}`;

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

var web3 = new Web3(INFURA);
Contract.setProvider(INFURA);

function sortByXp(nfts) {
  return nfts.sort(function (a, b) {
    return a.xp < b.xp ? 1 : b.xp < a.xp ? -1 : 0;
  });
}

async function updateNftTable(nfts) {
  const { error } = await supabase.from("nfts").upsert(sortByXp(nfts));
}

async function refresh() {
  var contract = new Contract(dNFT_ABI["abi"], dNFT);
  const totalSupply = await contract.methods.totalSupply().call();

  let nfts = [];

  for (let i = 0; i < totalSupply; i++) {
    console.log(i);
    const tokenId = await contract.methods.tokenByIndex(i).call();
    const nft = await contract.methods.idToNft(tokenId).call();
    nfts.push({
      id: tokenId,
      xp: nft.xp,
    });
  }

  await updateNftTable(sortByXp(nfts));
  return 0;
}

function subscribeToSync() {
  refresh();
  console.log("subscribing to sync");
  web3.eth
    .subscribe(
      "logs",
      {
        address: POOL,
        topics: [
          "0xff14d8520387b9b85d2a017dc41ae15db04a22d4c67deac04eb45048631ffa86",
        ],
      },
      function (error, result) {
        refresh();
        if (!error) console.log(result);
      }
    )
    .on("connected", function (subscriptionId) {
      console.log("SubID: ", subscriptionId);
    })
    .on("data", function (event) {
      console.log("Event:", event);
      // do stuff here
    })
    .on("changed", function (event) {
      //Do something when it is removed from the database.
    })
    .on("error", function (error, receipt) {
      console.log("Error:", error, receipt);
    });
}

subscribeToSync();
