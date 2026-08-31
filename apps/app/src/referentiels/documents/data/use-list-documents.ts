import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  TPreuveAudit,
  TPreuveLabellisation,
  TPreuveRapport,
} from '../../preuves/Bibliotheque/types';

type ReferentielDocuments = {
  labellisation: TPreuveLabellisation[];
  audit: TPreuveAudit[];
  rapport: TPreuveRapport[];
};

type ReferentielDocumentsQuery =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; documents: ReferentielDocuments };

export const useListDocuments = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}): ReferentielDocumentsQuery => {
  const trpc = useTRPC();

  const { data, isError } = useQuery(
    trpc.referentiels.documents.listDocuments.queryOptions({
      collectiviteId,
      referentielId,
    })
  );

  if (data) {
    return { status: 'loaded', documents: data };
  }
  return isError ? { status: 'error' } : { status: 'loading' };
};
