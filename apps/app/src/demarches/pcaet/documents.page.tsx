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
import { useDownloadDocument } from '@/app/collectivites/documents/data/use-download-document';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import type {
  DemarcheDocumentDepose,
  DemarcheDocumentEtape,
  DemarcheDocumentAdditional,
} from '@tet/domain/demarches';
import { isPublieDemarchePcaetStatus } from '@tet/domain/demarches';
import { EmptyCard } from '@tet/ui';
import { notFound } from 'next/navigation';
import { ComponentProps, PropsWithChildren } from 'react';

/** Un bloc de l'écran, sous son titre : avis, pièces de l'adoption, dossier transmis. */
const DocumentsBloc = ({
  titre,
  description,
  children,
}: PropsWithChildren<{ titre: string; description?: string }>) => (
  <section className="flex flex-col gap-3">
    <div className="flex flex-col gap-1">
      <h3 className="m-0 text-base font-bold text-primary-9">{titre}</h3>
      {description && <p className="m-0 text-sm text-grey-7">{description}</p>}
    </div>
    {children}
  </section>
);

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

  // Les avis se lisent dès la clôture de l'instruction, et le restent une fois
  // le PCAET adopté, quand plus rien ne s'y dépose.
  const instructionClose =
    !!demarche &&
    (demarche.avalModifiable || isPublieDemarchePcaetStatus(demarche.statut));

  const { avisRecus } = useDemarchePcaetAvisRecus({
    collectiviteId,
    demarcheId,
    // Un dépôt hors plateforme n'a aucun avis sur la plateforme : les siens ont
    // été rendus ailleurs, et les demander afficherait « aucun avis déposé ».
    enabled: instructionClose && demarche?.transmisHorsPlateforme !== true,
  });

  const { mutate: downloadDocument } = useDownloadDocument();

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
  const montreLesAvis = instructionClose && !demarche.transmisHorsPlateforme;

  const downloadDemarcheDocument = ({
    fichier,
  }: DemarcheDocumentDepose | DemarcheDocumentAdditional): void => {
    if (fichier) {
      downloadDocument({ collectiviteId, fichierId: fichier.id });
    }
  };

  const tableProps: ComponentProps<typeof DemarcheDocumentsTable> | null =
    snapshot
      ? {
          demarcheType: demarche.type,
          etape: etapeCourante,
          config: snapshot.config,
          definitions: snapshot.definitions,
          documents: snapshot.documents,
          documentsAdditional: snapshot.documentsAdditional,
          documentAdditionalCreeId,
          coverage,
          isEtapeReadonly: isEtapeReadonly(etapeCourante),
          mergeEtapes: parcours.horsPlateforme,
          // Adopté, le dossier ne se complète plus : il se lit.
          hideEmptyRows: isPublieDemarchePcaetStatus(demarche.statut),
          onAddFichier: addDocument,
          onRemoveDocument: removeDocument,
          onToggleCouverture: setCouverture,
          onCreateAdditional: createDocumentAdditional,
          onRenameAdditional: renameDocumentAdditional,
          onAddFichierAdditional: addFichierDocumentAdditional,
          onRemoveAdditional: removeDocumentAdditional,
          onDownload: downloadDemarcheDocument,
          onDownloadAdditional: downloadDemarcheDocument,
        }
      : null;

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
          !montreLesAvis
            ? appLabels.demarcheDetailDocumentsDescription
            : parcours.avalOuvert
            ? appLabels.demarcheDetailDocumentsAvalDescription
            : appLabels.demarcheDetailDocumentsAdopteDescription
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
        ) : isLoadingDocuments || !tableProps ? (
          <div className="flex py-8">
            <SpinnerLoader className="m-auto" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Les avis d'abord : c'est ce qui commande la reprise du dossier,
                et la raison d'être de cette étape. */}
            {montreLesAvis && (
              <DocumentsBloc titre={appLabels.demarcheDocumentsAvisRecusTitre}>
                {avisRecus.length > 0 ? (
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
                    description={
                      appLabels.demarcheDocumentsAucunAvisDescription
                    }
                  />
                )}
              </DocumentsBloc>
            )}

            {/* Après les avis, deux blocs : ce qu'il reste à déposer en tête —
                noyé sous le dossier transmis, on le cherchait au bas de la
                liste —, puis le dossier transmis, à reprendre ou à consulter.

                Un dépôt hors plateforme garde un seul tableau : ses deux temps
                sont ouverts ensemble, et les séparer donnerait à lire une
                coupure d'instruction qui n'a pas eu lieu. */}
            {montreLesAvis ? (
              <>
                <DocumentsBloc
                  titre={appLabels.demarcheDocumentsAdoptionTitre}
                  description={appLabels.demarcheDocumentsAdoptionDescription}
                >
                  <DemarcheDocumentsTable {...tableProps} section="adoption" />
                </DocumentsBloc>
                <DocumentsBloc
                  titre={appLabels.demarcheDocumentsDossierTransmisTitre}
                  description={
                    parcours.avalOuvert
                      ? appLabels.demarcheDocumentsDossierTransmisDescription
                      : appLabels.demarcheDocumentsDossierTransmisAdopteDescription
                  }
                >
                  <DemarcheDocumentsTable
                    {...tableProps}
                    section="dossier-transmis"
                  />
                </DocumentsBloc>
              </>
            ) : (
              <DemarcheDocumentsTable {...tableProps} />
            )}
          </div>
        )}
      </DemarcheSection>
    </DemarcheShell>
  );
};
