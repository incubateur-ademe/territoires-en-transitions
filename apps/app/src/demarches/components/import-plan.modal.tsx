'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { BetaLabel } from '@/app/ui/beta.label';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { AiImportFlow } from '@/app/plans/plans/import-plan/ai-import.flow';
import type { AiImportDefaults } from '@/app/plans/plans/import-plan/ai-import.form';
import { useGetPlan } from '@/app/plans/plans/show-plan/data/use-get-plan';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert, Button, Event, Modal, useEventTracker } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { countBy } from 'es-toolkit';
import { useState } from 'react';
import { useQueryStates } from 'nuqs';
import { aiImportQueryState } from '@/app/plans/plans/import-plan/ai-import.query-state';

type Props = {
  openState: OpenState;
  /** Type de plan attendu par la démarche, imposé à l'import. */
  planTypeId: number | undefined;
  /** Fichier et nom proposés d'office, connus de la démarche. */
  importDefaults?: AiImportDefaults;
  /** Plans associés à la démarche : le plan créé l'est-il ? */
  linkedPlanIds: number[];
  /**
   * La fin de l'import est traitée par l'appelant, qui reste monté : la
   * modale peut être fermée pendant l'import.
   */
  onImportStarted: (jobId: string, planId: number | null) => void;
};

type ModalStep = 'form' | 'progress' | 'done';

const ImportFinished = ({
  planId,
  isAssocie,
  onClose,
}: {
  planId: number;
  isAssocie: boolean;
  onClose: () => void;
}) => {
  const collectiviteId = useCollectiviteId();
  const plan = useGetPlan(planId);
  const axesCountByType = countBy(plan?.axes ?? [], (axe) =>
    axe.depth === 0 ? 'root' : axe.depth > 1 ? 'sousAxe' : 'axe'
  );
  const contenu = [
    appLabels.demarcheProgrammeAxes({ count: axesCountByType.axe ?? 0 }),
    appLabels.demarcheProgrammeSousAxes({
      count: axesCountByType.sousAxe ?? 0,
    }),
    appLabels.demarcheProgrammeNombreActions({ count: plan?.totalFiches ?? 0 }),
  ].join(', ');

  return (
    <div className="flex flex-col gap-6" data-test="demarches.plan.import-fini">
      <Alert
        state="success"
        title={appLabels.demarcheProgrammeImportModaleCree({
          nom: plan?.nom ?? appLabels.sansTitre,
          contenu,
          isAssocie,
        })}
      />
      <div className="flex justify-end gap-3">
        <Button variant="outlined" onClick={onClose}>
          {appLabels.fermer}
        </Button>
        <Button
          icon="arrow-right-line"
          iconPosition="right"
          href={makeCollectivitePlanActionUrl({
            collectiviteId,
            planActionUid: planId.toString(),
            openSecteurs: true,
          })}
          dataTest="demarches.plan.import-fini.verifier"
        >
          {appLabels.demarcheProgrammeVerifierEtCompleter}
        </Button>
      </div>
    </div>
  );
};

export const DemarcheImportPlanModal = ({
  openState,
  planTypeId,
  importDefaults,
  linkedPlanIds,
  onImportStarted,
}: Props) => {
  const demarcheId = useDemarcheId();
  const [, setImportQuery] = useQueryStates(aiImportQueryState);
  const tracker = useEventTracker();
  const [step, setStep] = useState<ModalStep>('form');
  const [createdPlanId, setCreatedPlanId] = useState<number | null>(null);

  const setIsOpen = (isOpen: boolean) => {
    if (!isOpen) {
      if (createdPlanId !== null) {
        // Le compte rendu reste dans l'historique ; la prochaine ouverture
        // doit permettre un nouvel import.
        void setImportQuery({ importJobId: null });
      }
      setStep('form');
      setCreatedPlanId(null);
    }
    openState.setIsOpen(isOpen);
  };

  return (
    <Modal
      size={step === 'form' ? 'lg' : 'md'}
      title={<BetaLabel>{appLabels.importPlanIaTitre}</BetaLabel>}
      subTitle={
        step === 'progress'
          ? appLabels.demarcheProgrammeImportModaleEnCours
          : step === 'done'
          ? appLabels.demarcheProgrammeImportModalePret
          : undefined
      }
      openState={{ isOpen: openState.isOpen, setIsOpen }}
      dataTest="demarches.plan.import-plan-modal"
      render={({ close }) =>
        createdPlanId !== null ? (
          <ImportFinished
            planId={createdPlanId}
            isAssocie={linkedPlanIds.includes(createdPlanId)}
            onClose={close}
          />
        ) : (
          <AiImportFlow
            origine="modale_demarche"
            demarcheId={demarcheId}
            lockedPlanTypeId={planTypeId}
            defaults={importDefaults}
            onImportStarted={onImportStarted}
            onPlanCreated={(planId) => {
              setCreatedPlanId(planId);
              setStep('done');
            }}
            onProgressVisibilityChange={(isProgressVisible) =>
              setStep((current) =>
                current === 'done'
                  ? current
                  : isProgressVisible
                  ? 'progress'
                  : 'form'
              )
            }
            renderStagesProgress={(stagesList) => (
              <div className="flex flex-col gap-6">
                {stagesList}
                <p className="m-0 text-sm text-grey-7">
                  {appLabels.demarcheProgrammeImportModaleArrierePlan}
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      tracker(Event.plans.importIa.arrierePlan, {
                        origine: 'modale_demarche',
                        demarcheId,
                      });
                      close();
                    }}
                    dataTest="demarches.plan.import-arriere-plan"
                  >
                    {appLabels.demarcheProgrammeContinuerArrierePlan}
                  </Button>
                </div>
              </div>
            )}
            cancelButton={
              <Button variant="outlined" type="button" onClick={close}>
                {appLabels.annuler}
              </Button>
            }
          />
        )
      }
    />
  );
};
