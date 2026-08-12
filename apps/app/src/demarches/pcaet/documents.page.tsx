'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { DemarcheShell } from '@/app/demarches/components/shell';
import { DemarcheDocumentsTable } from '@/app/demarches/components/documents.table';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useDemarchePcaetDocuments } from '@/app/demarches/pcaet/data/use-documents';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { appLabels } from '@/app/labels/catalog';
import { downloadFichier } from '@/app/referentiels/preuves/Bibliotheque/download-fichier';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { isDemarchePcaetDocumentsMutable } from '@tet/domain/demarches';
import { notFound } from 'next/navigation';

export const DemarchePcaetDocumentsPage = () => {
  const demarcheId = useDemarcheId();
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

  // Même règle de gel que le serveur, pour ne pas proposer une action qu'il
  // refusera : le dossier est gelé dès la transmission pour avis.
  const isDocumentReadonly = () =>
    !isDemarchePcaetDocumentsMutable(demarche.statut);

  return (
    <DemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="documents"
      onUpdate={update}
      onTransmettre={() => applyTransition('transmettre_pour_avis')}
      onReprendre={() => applyTransition('reprendre_elaboration')}
      onPublish={publish}
      onUnpublish={unpublish}
    >
      <DemarcheSection
        title={appLabels.demarcheDetailDocumentsTitre}
        description={appLabels.demarcheDetailDocumentsDescription}
        className="gap-2"
      >
        {isDocumentsError ? (
          <ErrorCard
            title={appLabels.demarcheDocumentsErreurChargement({
              type: appLabels.demarcheTypeLabels[demarche.type],
            })}
            retry={() => refetchDocuments()}
          />
        ) : isLoadingDocuments || !snapshot ? (
          <div className="flex py-8">
            <SpinnerLoader className="m-auto" />
          </div>
        ) : (
          <DemarcheDocumentsTable
            demarcheType={demarche.type}
            definitions={snapshot.definitions}
            documents={snapshot.documents}
            coverage={coverage}
            isDocumentReadonly={isDocumentReadonly}
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
      </DemarcheSection>
    </DemarcheShell>
  );
};
