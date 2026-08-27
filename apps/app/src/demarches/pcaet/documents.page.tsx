'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { DemarcheShell } from '@/app/demarches/components/shell';
import { DemarcheDocumentsTable } from '@/app/demarches/components/documents.table';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { AvisDeposesList } from '@/app/demarches/pcaet/components/avis-deposes.list';
import { useDemarchePcaetAvisRecus } from '@/app/demarches/pcaet/data/use-avis-recus';
import { useDemarchePcaetDocuments } from '@/app/demarches/pcaet/data/use-documents';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { appLabels } from '@/app/labels/catalog';
import { downloadFichier } from '@/app/referentiels/preuves/Bibliotheque/download-fichier';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import type {
  DemarcheDocumentDepose,
  DemarcheDocumentEtape,
  DemarcheDocumentAdditional,
} from '@tet/domain/demarches';
import { EmptyCard } from '@tet/ui';
import { notFound } from 'next/navigation';

export const DemarchePcaetDocumentsPage = () => {
  const demarcheId = useDemarcheId();
  const {
    demarche,
    completion,
    isLoading,
    update,
    transmettrePourAvis,
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

  // Les avis ne concernent que l'aval : inutile de les demander avant que
  // l'instruction soit close.
  const { avisRecus } = useDemarchePcaetAvisRecus({
    collectiviteId,
    demarcheId,
    enabled: demarche?.avalModifiable === true,
  });

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

  // Le temps où le dossier en est : l'aval dès que l'instruction est close,
  // l'amont avant. C'est lui qui décide du tableau affiché.
  const estAval = demarche.avalModifiable;
  const etapeCourante: DemarcheDocumentEtape = estAval ? 'aval' : 'amont';

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
      onPublish={publier}
      onUnpublish={depublier}
    >
      <DemarcheSection
        title={
          estAval
            ? appLabels.demarcheDetailAvisEtDocumentsTitre
            : appLabels.demarcheDetailDocumentsTitre
        }
        description={
          estAval
            ? appLabels.demarcheDetailDocumentsAvalDescription
            : appLabels.demarcheDetailDocumentsDescription
        }
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
            {/* Les avis d'abord : c'est ce qui commande la reprise du dossier,
                et la raison d'être de cette étape. */}
            {estAval &&
              (avisRecus.length > 0 ? (
                <AvisDeposesList
                  avis={avisRecus.map((unAvis) => ({
                    id: unAvis.id,
                    demandeAvisId: unAvis.demandeAvisId,
                    auTitreDe: unAvis.auTitreDe,
                    sens: unAvis.sens,
                    aUnRapport: unAvis.aUnRapport,
                    valideLe: unAvis.valideLe,
                    deposeLe: unAvis.valideLe,
                  }))}
                />
              ) : (
                <EmptyCard
                  picto={({ className }) => (
                    <PictoDocument className={className} />
                  )}
                  title={appLabels.demarcheDocumentsAucunAvisTitre}
                  description={appLabels.demarcheDocumentsAucunAvisDescription}
                />
              ))}

            {/* Un seul tableau, celui du temps courant. En aval il porte tout
                le dossier, dans l'ordre du modèle : les pièces reprises avec
                leur version transmise, et celles du seul amont en lecture
                seule — le dossier transmis reste consultable. */}
            <DemarcheDocumentsTable
              demarcheType={demarche.type}
              etape={etapeCourante}
              config={snapshot.config}
              definitions={snapshot.definitions}
              documents={snapshot.documents}
              documentsAdditional={snapshot.documentsAdditional}
              documentAdditionalCreeId={documentAdditionalCreeId}
              coverage={coverage}
              isEtapeReadonly={isEtapeReadonly(etapeCourante)}
              onAddFichier={(documentId, fichierId) =>
                addDocument(documentId, fichierId, etapeCourante)
              }
              onRemoveDocument={(documentId) =>
                removeDocument(documentId, etapeCourante)
              }
              onToggleCouverture={setCouverture}
              onCreateAdditional={createDocumentAdditional}
              onRenameAdditional={renameDocumentAdditional}
              onAddFichierAdditional={addFichierDocumentAdditional}
              onRemoveAdditional={removeDocumentAdditional}
              onDownload={downloadDocument}
              onDownloadAdditional={downloadDocument}
            />
          </div>
        )}
      </DemarcheSection>
    </DemarcheShell>
  );
};
