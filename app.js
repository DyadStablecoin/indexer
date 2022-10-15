import { createClient } from "@supabase/supabase-js";
import Web3 from "web3";
// import web3 from "web3-eth";
import Contract from "web3-eth-contract";
import { dNFT_ABI } from "./abi.js";

const dNFT = "0xEf569857eF000566272cDfc5Bf5E8681f347A871";
const N_NFTS = 100;
// const INFURA = "https://goerli.infura.io/v3/786a7764b8234b06b4cd6764a1646a17";
const INFURA = "wss://goerli.infura.io/ws/v3/786a7764b8234b06b4cd6764a1646a17";

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://zdsoetzzluqvefxlchjm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkc29ldHp6bHVxdmVmeGxjaGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjU4NTUwMDgsImV4cCI6MTk4MTQzMTAwOH0.7JY7WEW4dIKuPdBH3IXMIR7LNo3u67UWD1bAmMiP-7s"
);

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
calcAverageXP();

// sub();
// console.log(web3);
// setUpNftTable();
