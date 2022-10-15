import { createClient } from "@supabase/supabase-js";
import Web3 from "web3";
import Contract from "web3-eth-contract";
import { dNFT_ABI } from "./abi.js";

const dNFT = "0xEf569857eF000566272cDfc5Bf5E8681f347A871";
const N_NFTS = 100;
const INFURA = "https://goerli.infura.io/v3/786a7764b8234b06b4cd6764a1646a17";

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

Contract.setProvider(INFURA);

syncXP();

// console.log(web3);
// setUpNftTable();
