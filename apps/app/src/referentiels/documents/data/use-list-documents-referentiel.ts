import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { DocumentCollectivite } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { omit } from 'es-toolkit';
import {
  DocumentLegacy,
  toDocumentCollectivite,
} from '../../preuves/Bibliotheque/to-document-collectivite.utils';
import {
  PreuveAudit,
  PreuveLabellisation,
  PreuveRapport,
} from '../../preuves/Bibliotheque/types';

const toDocumentRattache = <Depot extends DocumentLegacy>(
  depot: Depot
): Omit<Depot, 'fichier' | 'lien'> & DocumentCollectivite => ({
  ...omit(depot, ['fichier', 'lien']),
  ...toDocumentCollectivite(depot),
});

type ReferentielDocuments = {
  labellisation: PreuveLabellisation[];
  audit: PreuveAudit[];
  rapport: PreuveRapport[];
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
        labellisation: data.labellisation.map(toDocumentRattache),
        audit: data.audit.map(toDocumentRattache),
        rapport: data.rapport.map(toDocumentRattache),
      },
    };
  }
  return isError ? { status: 'error' } : { status: 'loading' };
};
