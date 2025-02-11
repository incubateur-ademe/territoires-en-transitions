import { RouterInput, trpc } from '@/api/utils/trpc/client';

type computeScoreType = RouterInput['referentiels']['scores']['computeScore'];

export const useSaveScore = (
  referentielId: computeScoreType['referentielId'],
  collectiviteId: number,
  dateVersion: string | undefined, // If undefined, the backend will timestamp the current date
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
        date: dateVersion,
      },
    },
    {
      enabled: false,
      refetchOnWindowFocus: false,
    }
  );
};
