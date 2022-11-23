import { supabase } from "../supabase.ts";
import { SaveReponseParams } from "../types/saveReponseParams.ts";

export async function saveReponse(params: SaveReponseParams): Promise<void> {
  const { status } = await supabase.rpc(
    "save_reponse",
    // @ts-ignore()
    params,
  );
  if (status !== 200) {
    throw `La RPC 'save_reponse' devrait renvoyer un code 200. (${status} != 200)`;
  }
}
