import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  DocumentCollectivite,
  DocumentCollectiviteBase,
} from '@tet/domain/collectivites';
import { toDocumentCollectivite } from '../../preuves/Bibliotheque/to-document-collectivite.utils';
import {
  Fichier,
  PreuveAudit,
  PreuveLabellisation,
  PreuveLien,
  PreuveRapport,
} from '../../preuves/Bibliotheque/types';

type DocumentLegacy = DocumentCollectiviteBase & {
  fichier: Fichier | null;
  lien: PreuveLien | null;
};

const toPreuve = <Depot extends DocumentLegacy>(
  depot: Depot
): Omit<Depot, 'fichier' | 'lien'> & DocumentCollectivite => ({
  ...depot,
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
        labellisation: data.labellisation.map(toPreuve),
        audit: data.audit.map(toPreuve),
        rapport: data.rapport.map(toPreuve),
      },
    };
  }
  return isError ? { status: 'error' } : { status: 'loading' };
};
