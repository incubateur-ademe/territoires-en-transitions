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
import { hasDemarcheDocumentsForEtape } from '@tet/domain/demarches';
import type {
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentEtape,
  DemarcheDocumentAdditional,
} from '@tet/domain/demarches';
import { notFound } from 'next/navigation';

export const DemarchePcaetDocumentsPage = () => {
  const demarcheId = useDemarcheId();
  const {
    demarche,
    completion,
    isLoading,
    update,
    transmettrePourAvis,
    reprendreElaboration,
    publier,
    depublier,
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
    createDocumentAdditional,
    documentAdditionalCreeId,
    renameDocumentAdditional,
    addFichierDocumentAdditional,
    removeDocumentAdditional,
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

  // Le serveur dit ce qui reste modifiable : le front ne propose pas un dépôt
  // qu'il refuserait.
  const isEtapeReadonly = (etape: DemarcheDocumentEtape) =>
    etape === 'amont' ? !demarche.amontModifiable : !demarche.avalModifiable;
  const isDocumentReadonly = (definition: DemarcheDocumentDefinition) =>
    isEtapeReadonly(definition.etape);

  const downloadDocument = ({
    fichier,
  }: DemarcheDocumentDepose | DemarcheDocumentAdditional) =>
    downloadFichier({
      bucketId: fichier?.bucketId,
      hash: fichier?.hash,
      filename: fichier?.filename,
    });

  return (
    <DemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="documents"
      onUpdate={update}
      onTransmettre={transmettrePourAvis}
      onReprendre={reprendreElaboration}
      onPublish={publier}
      onUnpublish={depublier}
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
          <div className="flex flex-col gap-8">
            {/* Le dossier d'élaboration : les pièces aval ont leur propre liste,
                à l'étape où elles se déposent. */}
            <DemarcheDocumentsTable
              demarcheType={demarche.type}
              etape="amont"
              config={snapshot.config}
              definitions={snapshot.definitions}
              documents={snapshot.documents}
              documentsAdditional={snapshot.documentsAdditional}
              documentAdditionalCreeId={documentAdditionalCreeId}
              coverage={coverage}
              isDocumentReadonly={isDocumentReadonly}
              isEtapeReadonly={isEtapeReadonly('amont')}
              onAddFichier={addDocument}
              onRemoveDocument={removeDocument}
              onToggleCouverture={setCouverture}
              onCreateAdditional={createDocumentAdditional}
              onRenameAdditional={renameDocumentAdditional}
              onAddFichierAdditional={addFichierDocumentAdditional}
              onRemoveAdditional={removeDocumentAdditional}
              onDownload={downloadDocument}
              onDownloadAdditional={downloadDocument}
            />

            {/* Pièces produites après les avis : la sous-étape n'apparaît dans le
                stepper qu'une fois le PCAET adopté, la liste suit la même règle. */}
            {demarche.avalModifiable &&
              hasDemarcheDocumentsForEtape(snapshot, 'aval') && (
                <DemarcheDocumentsTable
                  demarcheType={demarche.type}
                  etape="aval"
                  config={snapshot.config}
                  definitions={snapshot.definitions}
                  documents={snapshot.documents}
                  documentsAdditional={snapshot.documentsAdditional}
                  documentAdditionalCreeId={documentAdditionalCreeId}
                  coverage={coverage}
                  isDocumentReadonly={isDocumentReadonly}
                  isEtapeReadonly={isEtapeReadonly('aval')}
                  onAddFichier={addDocument}
                  onRemoveDocument={removeDocument}
                  onToggleCouverture={setCouverture}
                  onCreateAdditional={createDocumentAdditional}
                  onRenameAdditional={renameDocumentAdditional}
                  onAddFichierAdditional={addFichierDocumentAdditional}
                  onRemoveAdditional={removeDocumentAdditional}
                  onDownload={downloadDocument}
                  onDownloadAdditional={downloadDocument}
                />
              )}
          </div>
        )}
      </DemarcheSection>
    </DemarcheShell>
  );
};
