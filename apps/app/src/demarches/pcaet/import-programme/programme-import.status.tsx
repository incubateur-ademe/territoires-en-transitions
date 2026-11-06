'use client';

import { appLabels } from '@/app/labels/catalog';
import { isAiImportAcceptedFilename } from '@/app/plans/plans/import-plan/ai-import.form';
import {
  getCurrentImportStage,
  getImportProgressPercent,
  toImportStageViews,
} from '@/app/plans/plans/import-plan/ai-import-stages.model';
import {
  AiImportProgressBar,
  getImportStageLabel,
} from '@/app/plans/plans/import-plan/ai-import-stages';
import { useFindPreviousAiImport } from '@/app/plans/plans/import-plan/data/use-find-previous-ai-import';
import { PlanStatusEnum } from '@tet/domain/plans';
import type { DemarcheDocumentFichier } from '@tet/domain/demarches';
import { Alert, Button } from '@tet/ui';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { useImportProgramme } from './import-programme.context';

const makeDismissKey = (demarcheId: number) =>
  `tet_demarche_pcaet_proposer_import_${demarcheId}`;

const ImportProgressCard = () => {
  const { ongoingStatus } = useImportProgramme();
  const stages = toImportStageViews(ongoingStatus?.stepStates);
  const etape = getImportStageLabel(
    getCurrentImportStage(stages),
    ongoingStatus?.withSecteurs ?? true
  ).toLowerCase();

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-grey-3 bg-grey-1 p-4"
      data-test="demarches.pcaet.documents.import-en-cours"
    >
      <p role="status" className="m-0 text-sm font-bold text-primary-9">
        {appLabels.demarcheProgrammeCreationEnCours({ etape })}
      </p>
      <AiImportProgressBar
        percent={getImportProgressPercent(ongoingStatus?.stepStates)}
      />
      <p className="m-0 text-xs text-grey-7">
        {appLabels.demarcheProgrammeCreationArrierePlan}
      </p>
    </div>
  );
};

const ProposeImportCard = ({
  onLater,
  onStart,
  isStarting,
}: {
  onLater: () => void;
  onStart: () => void;
  isStarting: boolean;
}) => (
  <div
    className="flex flex-col gap-4 rounded-lg border border-primary-3 bg-primary-0 p-4"
    data-test="demarches.pcaet.documents.proposer-import"
  >
    <div className="flex flex-col gap-1">
      <p className="m-0 text-sm font-bold text-primary-9">
        {appLabels.demarcheProgrammeProposerTitre}
      </p>
      <p className="m-0 text-sm text-grey-8">
        {appLabels.demarcheProgrammeProposerDescription}
      </p>
    </div>
    <div className="flex gap-3 justify-end">
      <Button
        size="sm"
        variant="outlined"
        onClick={onLater}
        dataTest="demarches.pcaet.documents.proposer-import.plus-tard"
      >
        {appLabels.demarcheProgrammeImportPlusTard}
      </Button>
      <Button
        size="sm"
        icon="sparkling-line"
        onClick={onStart}
        loading={isStarting}
        disabled={isStarting}
        dataTest="demarches.pcaet.documents.proposer-import.creer"
      >
        {appLabels.demarcheProgrammeProposerCreer}
      </Button>
    </div>
  </div>
);

/**
 * Où en est le plan créé à partir du programme d'actions déposé : proposé,
 * en cours de création, ou créé et à relire à l'étape suivante.
 */
export const ProgrammeImportStatus = ({
  demarcheId,
  programmeFichier,
  isAmontModifiable,
}: {
  demarcheId: number;
  programmeFichier: DemarcheDocumentFichier | undefined;
  isAmontModifiable: boolean;
}) => {
  const {
    isEnabled,
    isOngoing,
    ongoingStatus,
    startProgrammeImport,
    isStarting,
  } = useImportProgramme();
  const { previousImport, isLoading } = useFindPreviousAiImport({
    fichierId: programmeFichier?.id,
  });
  const [dismissedFichierId, setDismissedFichierId] = useLocalStorage<string>(
    makeDismissKey(demarcheId),
    undefined,
    { raw: true }
  );

  if (!isEnabled) {
    return null;
  }

  // Un import hors PCAET lancé ailleurs dans la collectivité ne concerne pas
  // ce programme d'actions.
  if (isOngoing && ongoingStatus?.withSecteurs !== false) {
    return <ImportProgressCard />;
  }

  if (previousImport?.planStatus === PlanStatusEnum.TO_VERIFY) {
    return (
      <div data-test="demarches.pcaet.documents.plan-cree">
        <Alert
          state="success"
          title={appLabels.demarcheProgrammePlanCree({
            nom: previousImport.planNom ?? appLabels.sansTitre,
          })}
        />
      </div>
    );
  }

  const canPropose =
    programmeFichier !== undefined &&
    isAmontModifiable &&
    !isOngoing &&
    // Lancé à l'instant depuis la modale de dépôt : l'import n'est pas encore
    // suivi, la proposition ne doit pas clignoter.
    !isStarting &&
    !isLoading &&
    previousImport === null &&
    isAiImportAcceptedFilename(programmeFichier.filename) &&
    dismissedFichierId !== String(programmeFichier.id);

  if (!canPropose) {
    return null;
  }

  return (
    <ProposeImportCard
      isStarting={isStarting}
      onLater={() => setDismissedFichierId(String(programmeFichier.id))}
      onStart={() => startProgrammeImport(programmeFichier.id)}
    />
  );
};
