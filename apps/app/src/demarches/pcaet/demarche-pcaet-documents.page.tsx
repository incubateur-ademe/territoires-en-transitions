'use client';

import { DemarchePcaetSection } from '@/app/demarches/pcaet/components/demarche-pcaet-section';
import { DemarchePcaetPublicationStatusEnum } from '@tet/domain/demarches';
import { PcaetDemarcheShell } from '@/app/demarches/pcaet/components/pcaet-demarche.shell';
import { PcaetDocumentsTable } from '@/app/demarches/pcaet/components/pcaet-documents-table';
import { emptyDemarchePcaetCompletion } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche-pcaet';
import { useDemarchePcaetDocuments } from '@/app/demarches/pcaet/data/use-demarche-pcaet-documents';
import { useDemarchePcaetId } from '@/app/demarches/pcaet/use-demarche-pcaet-id';
import { appLabels } from '@/app/labels/catalog';
import { downloadFichier } from '@/app/referentiels/preuves/Bibliotheque/download-fichier';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { isDemarchePcaetDocumentsMutable } from '@tet/domain/demarches';
import { notFound } from 'next/navigation';

export const DemarchePcaetDocumentsPage = () => {
  const demarcheId = useDemarchePcaetId();
  const {
    demarche,
    completion,
    isLoading,
    update,
    applyTransition,
    publish,
    unpublish,
    collectiviteId,
  } = useDemarchePcaet(demarcheId);
  const {
    snapshot,
    coverage,
    isLoading: isLoadingDocuments,
    isError: isDocumentsError,
    refetch: refetchDocuments,
    addDocument,
    removeDocument,
    setCouverture,
  } = useDemarchePcaetDocuments(demarcheId);

  if (isLoading) {
    return (
      <div className="flex grow items-center justify-center">
        <SpinnerLoader />
      </div>
    );
  }

  if (!demarche) {
    notFound();
  }

  // Le dossier est gelé dès sa transmission pour avis : même règle que le
  // serveur, pour ne pas proposer une action qu'il refusera.
  const isReadonly = !isDemarchePcaetDocumentsMutable(demarche.statut);

  return (
    <PcaetDemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion ?? emptyDemarchePcaetCompletion()}
      activeSection="documents"
      onUpdate={update}
      onTransmettre={() => applyTransition('transmettre_pour_avis')}
      onReprendre={() => applyTransition('reprendre_elaboration')}
      onPublish={publish}
      onUnpublish={unpublish}
    >
      <DemarchePcaetSection
        title={appLabels.demarchePcaetDetailDocumentsTitre}
        description={appLabels.demarchePcaetDetailDocumentsDescription}
        className="gap-2"
      >
        {isDocumentsError ? (
          <ErrorCard
            title={appLabels.demarchePcaetDocumentsErreurChargement}
            retry={() => refetchDocuments()}
          />
        ) : isLoadingDocuments || !snapshot ? (
          <div className="flex py-8">
            <SpinnerLoader className="m-auto" />
          </div>
        ) : (
          <PcaetDocumentsTable
            definitions={snapshot.definitions}
            documents={snapshot.documents}
            coverage={coverage}
            planActionRattache={snapshot.planActionRattache}
            isReadonly={isReadonly}
            onAddFichier={addDocument}
            onRemoveDocument={removeDocument}
            onToggleCouverture={setCouverture}
            onDownload={({ fichier }) =>
              downloadFichier({
                bucketId: fichier?.bucketId,
                hash: fichier?.hash,
                filename: fichier?.filename,
              })
            }
          />
        )}
      </DemarchePcaetSection>
    </PcaetDemarcheShell>
  );
};
