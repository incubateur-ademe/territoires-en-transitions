'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { DemarcheShell } from '@/app/demarches/components/shell';
import {
  findPcaetPlanType,
  PCAET_PLAN_TYPE_LABEL,
} from '@/app/demarches/pcaet/constants';
import type { DemarcheCreatePlanPayload } from '@/app/demarches/components/create-plan.modal';
import { ProgrammeActionsSection } from '@/app/demarches/components/plan.section';
import { useCreateAndLinkPlan } from '@/app/demarches/pcaet/data/use-create-and-link-plan';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import { useListPlanTypes } from '@/app/plans/plans/use-list-plan-types';
import { notFound } from 'next/navigation';

export const DemarchePcaetPlanActionsPage = () => {
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

  const { data: planTypes, isLoading: isLoadingPlanTypes } = useListPlanTypes();
  const pcaetPlanType = findPcaetPlanType(planTypes);

  // Le rattachement d'office ne vaut que pour le premier plan (règle appliquée
  // côté serveur) : passé celui-là, le plan créé attend d'être rattaché à la
  // main. L'état connu ici ne sert qu'à annoncer le bon message.
  const { mutateAsync: createAndLinkPlan } = useCreateAndLinkPlan(demarcheId, {
    willLink: (demarche?.planActionIds.length ?? 0) === 0,
  });
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
      onReprendre={reprendreElaboration}
      onPublish={publier}
      onUnpublish={depublier}
    >
      <ProgrammeActionsSection
        demarche={demarche}
        eligibility={{
          planTypeLabel: PCAET_PLAN_TYPE_LABEL,
          planTypeId: pcaetPlanType?.id,
        }}
        isLoadingEligibility={isLoadingPlanTypes}
        onUpdateAction={update}
        onCreatePlan={createPlan}
      />
    </DemarcheShell>
  );
};
