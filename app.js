import { createClient } from "@supabase/supabase-js";
import Web3 from "web3";
// import web3 from "web3-eth";
import Contract from "web3-eth-contract";
import dNFT_ABI from "./abi/dNFT.json" assert { type: "json" };
import * as dotenv from "dotenv";
dotenv.config();

const dNFT = "0x2544bA4Bc4A1d4Eb834a2770Fd5B52bAfa500B44";
const N_NFTS = 300;
const INFURA = `wss://goerli.infura.io/ws/v3/${process.env.GOERLI_INFURA_PROJECT_ID}`;
console.log(INFURA);

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

Contract.setProvider(INFURA);

function sortByXp(nfts) {
  return nfts.sort(function (a, b) {
    return a.xp < b.xp ? 1 : b.xp < a.xp ? -1 : 0;
  });
}

async function setup() {
  var contract = new Contract(dNFT_ABI["abi"], dNFT);
  const totalSupply = await contract.methods.totalSupply().call();

  let nfts = [];

  for (let i = 0; i < totalSupply; i++) {
    console.log(i);
    const tokenId = await contract.methods.tokenByIndex(i).call();
    const nft = await contract.methods.idToNft(tokenId).call();
    nfts.push(nft);
    console.log(nft);
    if (i == 5) {
      break;
    }
  }

  console.log(sortByXp(nfts));
}

setup();

async function setUpNftTable() {
  // If row exists it will not be overwritten!
  var rows = [];
  for (let i = 0; i < N_NFTS; i++) {
    rows.push({ index: i });
  }
  const { error } = await supabase.from("nfts").upsert(rows);
  console.log(error);
}

async function syncXP() {
  var contract = new Contract(dNFT_ABI, dNFT);
  var rows = [];
  for (let i = 0; i < N_NFTS; i++) {
    console.log(i);
    const xp = await contract.methods.xp(i).call();
    rows.push({ index: i, xp: xp });
  }
  const { error } = await supabase.from("nfts").upsert(rows);
  console.log(error);
}

async function subXP() {
  /*
   * we need to check if the old value was not max or min!
   */

  // just for testing
  const newXP = 11500;

  // always has column id 0
  const { data } = await supabase.from("sum").select().eq("id", 0);
  console.log(data);
  const minXP = parseInt(data[0].minXP);
  const maxXP = parseInt(data[0].maxXP);

  if (newXP < minXP) {
    console.log("newXP < minXP");
    const { error } = await supabase
      .from("sum")
      .update({ minXP: newXP })
      .eq("id", 0);
    console.log(error);
  }

  if (newXP > maxXP) {
    console.log("newXP > minXP");
    const { error } = await supabase
      .from("sum")
      .update({ maxXP: newXP })
      .eq("id", 0);
  }
}

function sub() {
  var web3 = new Web3(INFURA);
  var subscription = web3.eth
    .subscribe(
      "logs",
      {
        address: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", // weth
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        ],
      },
      function (error, result) {
        console.log(3333);
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

async function calcAverageXP() {
  var average = 0;
  const { data } = await supabase.from("nfts").select("xp");
  data.map((d) => {
    average += parseInt(d.xp);
  });
  average = average / N_NFTS;
  console.log(average);
  const { error } = await supabase
    .from("sum")
    .update({ averageXP: average })
    .eq("id", 0);
  console.log(error);
  // console.log(data);
}

// syncXP();
// subXP();
// const ss = sub();
// calcAverageXP();

// sub();
// console.log(web3);
// setUpNftTable();
