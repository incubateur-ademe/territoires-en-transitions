'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { DemarcheShell } from '@/app/demarches/components/shell';
import { getDemarcheParcours } from '@/app/demarches/steps';
import { DemarcheDocumentsTable } from '@/app/demarches/components/documents.table';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { AvisDeposesList } from '@/app/demarches/pcaet/components/avis-deposes.list';
import { useDemarchePcaetAvisRecus } from '@/app/demarches/pcaet/data/use-avis-recus';
import { useDemarchePcaetDocuments } from '@/app/demarches/pcaet/data/use-documents';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { appLabels } from '@/app/labels/catalog';
import { useDownloadDocument } from '@/app/referentiels/preuves/data/use-download-document';
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
    // Un dépôt hors plateforme n'a aucun avis sur la plateforme : les siens ont
    // été rendus ailleurs, et les demander afficherait « aucun avis déposé ».
    enabled:
      demarche?.avalModifiable === true &&
      demarche?.transmisHorsPlateforme !== true,
  });

  const { mutate: downloadDocument } = useDownloadDocument({ collectiviteId });

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
  // l'amont avant. C'est lui qui décide du ou des tableaux affichés — un dépôt
  // hors plateforme a les deux ouverts, et doit donc les voir tous les deux.
  const parcours = getDemarcheParcours(demarche);
  const etapeCourante: DemarcheDocumentEtape = parcours.etape;

  // Les avis se lisent sur la **provenance**, non sur l'état du parcours : une
  // fois publié, un dépôt hors plateforme referme ses deux temps et cesserait
  // d'être « hors plateforme » au sens du parcours — l'écran se remettrait alors
  // à annoncer « aucun avis déposé » sur un dossier dont les avis ont été rendus
  // ailleurs. C'est justement ce que le drapeau de provenance sait encore dire.
  const montreLesAvis = parcours.avalOuvert && !demarche.transmisHorsPlateforme;

  const downloadDemarcheDocument = ({
    fichier,
  }: DemarcheDocumentDepose | DemarcheDocumentAdditional): void => {
    if (fichier) {
      downloadDocument(fichier.id);
    }
  };

  return (
    <DemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="documents"
      onUpdate={update}
      onTransmettre={transmettrePourAvis}
      onPublish={publier}
    >
      <DemarcheSection
        title={
          montreLesAvis
            ? appLabels.demarcheDetailAvisEtDocumentsTitre
            : appLabels.demarcheDetailDocumentsTitre
        }
        description={
          montreLesAvis
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
            {montreLesAvis &&
              (avisRecus.length > 0 ? (
                <AvisDeposesList
                  avis={avisRecus.map((unAvis) => ({
                    id: unAvis.id,
                    demandeAvisId: unAvis.demandeAvisId,
                    auTitreDe: unAvis.auTitreDe,
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

            {/* Un seul tableau, toujours. D'ordinaire celui du temps courant :
                en aval il porte tout le dossier, dans l'ordre du modèle — les
                pièces reprises avec leur version transmise, et celles du seul
                amont en lecture seule, le dossier transmis restant consultable.

                Un dépôt hors plateforme a ses deux temps ouverts : la liste les
                fusionne, pièces d'élaboration puis pièces d'après-avis. Deux
                tableaux y donneraient à lire une coupure d'instruction qui n'a
                pas eu lieu. */}
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
              mergeEtapes={parcours.horsPlateforme}
              onAddFichier={(documentId, fichierId, etapeDocument) =>
                addDocument(documentId, fichierId, etapeDocument)
              }
              onRemoveDocument={(documentId, etapeDocument) =>
                removeDocument(documentId, etapeDocument)
              }
              onToggleCouverture={setCouverture}
              onCreateAdditional={createDocumentAdditional}
              onRenameAdditional={renameDocumentAdditional}
              onAddFichierAdditional={addFichierDocumentAdditional}
              onRemoveAdditional={removeDocumentAdditional}
              onDownload={downloadDemarcheDocument}
              onDownloadAdditional={downloadDemarcheDocument}
            />
          </div>
        )}
      </DemarcheSection>
    </DemarcheShell>
  );
};
