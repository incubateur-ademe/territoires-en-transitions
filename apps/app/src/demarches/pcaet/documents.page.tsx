'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { DocumentsBloc } from '@/app/demarches/components/documents-bloc';
import { demarchePcaetAutosaveKeys } from '@/app/demarches/pcaet/data/autosave-keys';
import { DemarcheShell } from '@/app/demarches/components/shell';
import { getDemarcheParcours } from '@/app/demarches/steps';
import { DemarcheDocumentsTable } from '@/app/demarches/components/documents.table';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { AvisDeposesList } from '@/app/demarches/pcaet/components/avis-deposes.list';
import { PROGRAMME_ACTIONS_DOCUMENT_ID } from '@/app/demarches/pcaet/constants';
import { useImportProgramme } from '@/app/demarches/pcaet/import-programme/import-programme.context';
import { ProgrammeImportStatus } from '@/app/demarches/pcaet/import-programme/programme-import.status';
import { useGetProgrammeActionsFichier } from '@/app/demarches/pcaet/data/use-get-programme-actions-fichier';
import type { AddDocumentFollowUpChoice } from '@/app/collectivites/documents/add-document/follow-up.checkbox';
import { useDemarchePcaetAvisRecus } from '@/app/demarches/pcaet/data/use-avis-recus';
import { useDemarchePcaetDocuments } from '@/app/demarches/pcaet/data/use-documents';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import {
  toDemarcheTrackingSubject,
  useDemarcheTracker,
} from '@/app/demarches/use-demarche-tracker';
import { appLabels } from '@/app/labels/catalog';
import { useDownloadDocument } from '@/app/collectivites/documents/data/use-download-document';
import { isAiImportAcceptedFilename } from '@/app/plans/plans/import-plan/ai-import.form';
import PictoDocument from '@/app/ui/pictogrammes/PictoDocument';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useAutosaveStatus } from '@/app/utils/react-query/autosave-status/use-autosave-status';
import type {
  DemarcheDocumentDepose,
  DemarcheDocumentEtape,
  DemarcheDocumentAdditional,
} from '@tet/domain/demarches';
import {
  DemarchePcaetStatusEnum,
  isPublieDemarchePcaetStatus,
} from '@tet/domain/demarches';
import { AutosaveBadge, EmptyCard, Event } from '@tet/ui';
import { notFound } from 'next/navigation';
import { ComponentProps } from 'react';

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
  const autosaveStatus = useAutosaveStatus(
    demarchePcaetAutosaveKeys.documents(demarcheId)
  );

  const instructionClose =
    !!demarche &&
    (demarche.avalModifiable || isPublieDemarchePcaetStatus(demarche.statut));

  // Un avis validé se lit sans attendre l'autre service ni la fin du délai :
  // le mail « avis reçu » renvoie ici dès la validation.
  const enInstruction =
    demarche?.statut === DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS;

  const { avisRecus } = useDemarchePcaetAvisRecus({
    collectiviteId,
    demarcheId,
    // Un dépôt hors plateforme n'a aucun avis sur la plateforme : les siens ont
    // été rendus ailleurs, et les demander afficherait « aucun avis déposé ».
    enabled:
      (instructionClose || enInstruction) &&
      demarche?.transmisHorsPlateforme !== true,
  });

  const { mutate: downloadDocument } = useDownloadDocument();
  const track = useDemarcheTracker(
    demarche ? toDemarcheTrackingSubject(demarche) : null
  );
  const programmeFichier = useGetProgrammeActionsFichier(demarcheId);

  const {
    isEnabled: isImportEnabled,
    isOngoing: isImportOngoing,
    startProgrammeImport,
  } = useImportProgramme();

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

  // Pendant l'instruction, le bloc n'apparaît qu'avec un premier avis : un
  // « aucun avis reçu » laisserait croire le délai échu.
  const montreLesAvisRecus =
    montreLesAvis || (enInstruction && avisRecus.length > 0);

  const downloadDemarcheDocument = (
    document: DemarcheDocumentDepose | DemarcheDocumentAdditional
  ): void => {
    const { fichier } = document;
    if (fichier) {
      track(Event.demarches.pcaet.documentTelecharge, {
        documentId: 'documentId' in document ? document.documentId : null,
        etape: document.etape,
        additionnel: !('documentId' in document),
      });
      downloadDocument({ collectiviteId, fichierId: fichier.id });
    }
  };

  // Le programme d'actions déposé est la source de l'import : la création du
  // plan se propose dès le dépôt. Un import en cours l'emporte (un seul par
  // collectivité).
  const canCreatePlanFromProgramme =
    isImportEnabled && !isImportOngoing && demarche.amontModifiable;

  const addFichier = (
    documentId: string,
    fichierId: number,
    etape: DemarcheDocumentEtape,
    choice?: AddDocumentFollowUpChoice
  ) =>
    addDocument(documentId, fichierId, etape, {
      onSuccess: () => {
        if (
          documentId === PROGRAMME_ACTIONS_DOCUMENT_ID &&
          canCreatePlanFromProgramme
        ) {
          track(Event.demarches.pcaet.importProgrammeChoix, {
            choix: choice?.followUp ? 'creer_au_depot' : 'sans_import',
          });
        }
        if (
          documentId === PROGRAMME_ACTIONS_DOCUMENT_ID &&
          choice?.followUp &&
          canCreatePlanFromProgramme
        ) {
          void startProgrammeImport(fichierId);
        }
      },
    });

  const uploadOptionsByDocumentId = {
    [PROGRAMME_ACTIONS_DOCUMENT_ID]: {
      title: appLabels.demarcheProgrammeDeposerTitre,
      followUp: canCreatePlanFromProgramme
        ? {
            label: appLabels.demarcheProgrammeCreerPlanIa,
            description: appLabels.demarcheProgrammeCreerPlanIaAide,
            submitLabel: appLabels.demarcheProgrammeAjouterEtCreerPlan,
            defaultChecked: true,
            isApplicable: isAiImportAcceptedFilename,
          }
        : undefined,
    },
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
          onAddFichier: addFichier,
          uploadOptionsByDocumentId,
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
        action={
          !isEtapeReadonly(etapeCourante) && (
            <AutosaveBadge
              status={autosaveStatus}
              dataTest="demarches.pcaet.documents.autosave"
            />
          )
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
            {montreLesAvisRecus && (
              <DocumentsBloc titre={appLabels.demarcheDocumentsAvisRecusTitre}>
                {avisRecus.length > 0 ? (
                  <AvisDeposesList
                    avis={avisRecus.map((unAvis) => ({
                      id: unAvis.id,
                      demandeAvisId: unAvis.demandeAvisId,
                      auTitreDe: unAvis.auTitreDe,
                      nombrePieces: unAvis.nombrePieces,
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
              <>
                <DemarcheDocumentsTable {...tableProps} />
                <ProgrammeImportStatus
                  demarcheId={demarcheId}
                  programmeFichier={programmeFichier}
                  isAmontModifiable={demarche.amontModifiable}
                />
              </>
            )}
          </div>
        )}
      </DemarcheSection>
    </DemarcheShell>
  );
};
