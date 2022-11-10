import { ActionScore, ClientScores } from "../../lib/types/clientScores.ts";

export function scoreById(
  clientScores: ClientScores,
  actionId: string,
): ActionScore {
  return clientScores.scores.filter((s: ActionScore) =>
    s.action_id === actionId
  )[0]!;
}
