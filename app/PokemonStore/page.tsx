import { getAllItems } from "@/lib/data";
import PokemonStoreClient from "./pokemon-store-client";

// Re-validate the catalog every minute. The Supabase response itself isn't
// cached by Next (no fetch wrapper), but this caps how often the server has to
// run the merge logic for a hot route. Admin mutations only need <60s to show.
export const revalidate = 60;

export default async function PokemonStorePage() {
  const items = await getAllItems();
  return <PokemonStoreClient initialItems={items} />;
}
