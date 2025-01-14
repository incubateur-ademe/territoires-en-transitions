import { RouterInput, trpc } from '@/api/utils/trpc/client';

type computeScoreType = RouterInput['referentiels']['scores']['computeScore'];

export const useSaveScore = (
  referentielId: computeScoreType["referentielId"],
  collectiviteId: number,
  dateVersion: string,
  nomVersion: string
) => {
  // It's a query, not a mutation because the call doesn't save if parameters.snapshot is false
  return trpc.referentiels.scores.computeScore.useQuery(
    {
      referentielId: referentielId,
      collectiviteId: collectiviteId,
      parameters: {
        snapshot: true,
        snapshotNom: nomVersion,
        date: new Date(dateVersion).toISOString(),
      },
    },
    {
      enabled: false,
      refetchOnWindowFocus: false,
    }
  );
};
