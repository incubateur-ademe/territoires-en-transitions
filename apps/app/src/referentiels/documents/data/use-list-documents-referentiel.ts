import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  DocumentAudit,
  DocumentLabellisation,
  DocumentRapport,
} from '../../preuves/Bibliotheque/types';

type ReferentielDocuments = {
  labellisation: DocumentLabellisation[];
  audit: DocumentAudit[];
  rapport: DocumentRapport[];
};

type ReferentielDocumentsQuery =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; documents: ReferentielDocuments };

export const useListDocumentsReferentiel = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}): ReferentielDocumentsQuery => {
  const trpc = useTRPC();

  const { data, isError } = useQuery(
    trpc.referentiels.documents.listDocumentsReferentiel.queryOptions({
      collectiviteId,
      referentielId,
    })
  );

  if (data) {
    return {
      status: 'loaded',
      documents: {
        labellisation: data.labellisation,
        audit: data.audit,
        rapport: data.rapport,
      },
    };
  }
  return isError ? { status: 'error' } : { status: 'loading' };
};
