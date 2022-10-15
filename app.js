import { createClient } from "@supabase/supabase-js";

const N_NFTS = 10;

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://zdsoetzzluqvefxlchjm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpkc29ldHp6bHVxdmVmeGxjaGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjU4NTUwMDgsImV4cCI6MTk4MTQzMTAwOH0.7JY7WEW4dIKuPdBH3IXMIR7LNo3u67UWD1bAmMiP-7s"
);

async function setUpNftTable() {
  var rows = [];
  for (let i = 0; i < N_NFTS; i++) {
    rows.push({ index: i });
  }
  const { error } = await supabase.from("nfts").insert(rows);
}

const { data, error } = await supabase.from("nfts").select();

console.log(data);

setUpNftTable();
