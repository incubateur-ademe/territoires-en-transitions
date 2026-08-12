'use client';

import { useGetCollectivite } from '@/app/collectivites/collectivites/use-get-collectivite';
import { appLabels } from '@/app/labels/catalog';
import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { usePreuvesParType } from '../preuves/usePreuves';
import { useReferentielId } from '../referentiel-context';
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

  const preuves = usePreuvesParType({
    preuve_types: ['audit', 'labellisation', 'rapport'],
  });

  const { labellisation, audit, rapport } = preuves;
  const labellisationEtAudit = [...(labellisation || []), ...(audit || [])];
  const demandesLabellisationEtAudit = Object.entries(
    groupeParDemande(labellisationEtAudit, referentielId)
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

  if (isNewReferentiel) {
    return null;
  }

  return (
    <div data-test="BibliothequeDocs" className="flex flex-col gap-8">
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
          {isReadOnly && (!rapport || rapport.length === 0) && (
            <p>{appLabels.aucunRapportVisiteAnnuelle}</p>
          )}
          {rapport?.map((preuve) => (
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
