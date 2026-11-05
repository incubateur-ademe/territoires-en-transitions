'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { DemarcheShell } from '@/app/demarches/components/shell';
import {
  findPcaetPlanType,
  makeProgrammeActionsPlanName,
  PCAET_PLAN_TYPE_LABEL,
} from '@/app/demarches/pcaet/constants';
import type { DemarcheCreatePlanPayload } from '@/app/demarches/components/create-plan.modal';
import { ProgrammeActionsSection } from '@/app/demarches/components/plan.section';
import { RappelPlanSection } from '@/app/demarches/pcaet/components/rappel-plan.section';
import { appLabels } from '@/app/labels/catalog';
import { useCreateAndLinkPlan } from '@/app/demarches/pcaet/data/use-create-and-link-plan';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useGetProgrammeActionsFichier } from '@/app/demarches/pcaet/data/use-get-programme-actions-fichier';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { useListPlanTypes } from '@/app/plans/plans/use-list-plan-types';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { notFound } from 'next/navigation';

export const DemarchePcaetPlanActionsPage = () => {
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

  const { data: planTypes, isLoading: isLoadingPlanTypes } = useListPlanTypes();
  const pcaetPlanType = findPcaetPlanType(planTypes);
  const programmeActionsFichier = useGetProgrammeActionsFichier(demarcheId);
  const { nom: collectiviteNom } = useCurrentCollectivite();

  // Le rattachement d'office ne vaut que pour le premier plan : la règle vit
  // côté serveur, le front n'a rien à en déduire.
  const { mutateAsync: createAndLinkPlan } = useCreateAndLinkPlan(demarcheId);
  const createPlan = async (payload: DemarcheCreatePlanPayload) => {
    try {
      await createAndLinkPlan({ collectiviteId, demarcheId, ...payload });
      return true;
    } catch {
      // Le toast d'erreur global est déjà affiché ; la modale reste ouverte.
      return false;
    }
  };

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

  return (
    <DemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="plan"
      onUpdate={update}
      onTransmettre={transmettrePourAvis}
      onPublish={publier}
    >
      {/* Pendant la phase d'avis, et une fois publié, l'écran ne sert qu'à
          relire le programme transmis, dans la vue même que lisent les
          instructeurs. Après les avis, il se rouvre comme à l'élaboration : la
          collectivité peut encore rattacher, détacher ou modifier ses plans
          avant le dépôt final. */}
      {!demarche.contenuModifiable ? (
        <RappelPlanSection
          collectiviteId={collectiviteId}
          demarcheId={demarcheId}
          typeLabels={appLabels.demarcheTypeLabels[demarche.type]}
        />
      ) : (
        <ProgrammeActionsSection
          demarche={demarche}
          eligibility={{
            planTypeLabel: PCAET_PLAN_TYPE_LABEL,
            planTypeId: pcaetPlanType?.id,
          }}
          isLoadingEligibility={isLoadingPlanTypes}
          onUpdateAction={update}
          onCreatePlan={createPlan}
          importDefaults={{
            fichierId: programmeActionsFichier?.id,
            planName: makeProgrammeActionsPlanName({
              dateLancement: demarche.dateLancement,
              collectiviteNom,
            }),
          }}
        />
      )}
    </DemarcheShell>
  );
};
