'use client';

import { useGetCollectivite } from '@/app/collectivites/collectivites/use-get-collectivite';
import { appLabels } from '@/app/labels/catalog';
import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Alert } from '@tet/ui';
import { useReferentielId } from '../referentiel-context';
import { useListDocuments } from './data/use-list-documents';
import { AddRapportVisite } from './AddRapportVisite';
import { groupeParDemande } from './groupeParDemande';
import { addInfoToEntry, PreuvesLabellisation } from './PreuveLabellisation';
import { PreuvesTable } from './PreuvesTable';
import { useTableData } from './useTableData';

export const DocumentsView = () => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const { data: identite } = useGetCollectivite(collectiviteId);
  const isCOT = Boolean(identite?.activeCOT);
  const isReadOnly = !hasCollectivitePermission('referentiels.mutate');

  const referentielId = useReferentielId();
  const tableData = useTableData(referentielId);

  const documents = useListDocuments({ collectiviteId, referentielId });
  const { labellisation, audit, rapport } =
    documents.status === 'loaded'
      ? documents.documents
      : { labellisation: [], audit: [], rapport: [] };

  const demandesLabellisationEtAudit = Object.entries(
    groupeParDemande([...labellisation, ...audit], referentielId)
  )
    .map(addInfoToEntry)
    .sort((a, b) => b.info.timestamp - a.info.timestamp);

  const isNewReferentiel =
    referentielId === 'te' || referentielId === 'te-test';

  // COT : rapports visibles sur CAE et ECI ; sinon uniquement sur CAE
  const showRapports =
    referentielId === 'cae' || (isCOT && referentielId === 'eci');

  const showDemandesLabellisationEtAudit =
    demandesLabellisationEtAudit.length > 0;

  const showDocumentsTitle = showDemandesLabellisationEtAudit || showRapports;

  const showEmptyRapportsMessage =
    isReadOnly && documents.status === 'loaded' && rapport.length === 0;

  if (isNewReferentiel) {
    return null;
  }

  return (
    <div data-test="BibliothequeDocs" className="flex flex-col gap-8">
      {documents.status === 'loading' && <SpinnerLoader className="m-auto" />}
      {documents.status === 'error' && (
        <Alert state="error" title={appLabels.erreurChargementDocuments} />
      )}
      {showDemandesLabellisationEtAudit && (
        <section data-test="labellisation">
          <h2 className="mb-6 text-2xl">
            {appLabels.documentsAuditEtLabellisationReferentiel}
          </h2>
          <PreuvesLabellisation demandes={demandesLabellisationEtAudit} />
        </section>
      )}
      {showRapports && (
        <section data-test="rapports">
          <h2 className="mb-6 text-2xl">
            {appLabels.rapportsDeVisiteAnnuelle}
          </h2>
          {!isReadOnly && <AddRapportVisite />}
          {showEmptyRapportsMessage && (
            <p>{appLabels.aucunRapportVisiteAnnuelle}</p>
          )}
          {rapport.map((preuve) => (
            <div className="py-4" key={preuve.id}>
              <PreuveDoc preuve={preuve} />
            </div>
          ))}
        </section>
      )}
      <section>
        {showDocumentsTitle && (
          <h2 className="mb-6 text-2xl">{appLabels.documents}</h2>
        )}
        <PreuvesTable tableData={tableData} referentielId={referentielId} />
      </section>
    </div>
  );
};
