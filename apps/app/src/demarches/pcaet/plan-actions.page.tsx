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
import { useCreatePlanForDemarche } from '@/app/demarches/pcaet/data/use-create-plan';
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

  const { mutateAsync: createAndLinkPlan } = useCreateAndLinkPlan(demarcheId);
  const { mutateAsync: createPlanWithoutLink } = useCreatePlanForDemarche();
  // Une démarche ne tient qu'un plan : quand elle en a déjà un, la création
  // reste ouverte mais ne rattache pas — sinon elle remplacerait le plan en
  // place sans que rien ne l'ait annoncé.
  const createPlan = async (payload: DemarcheCreatePlanPayload) => {
    try {
      if (demarche?.planActionId != null) {
        await createPlanWithoutLink({
          collectiviteId,
          nom: payload.nom,
          typeId: payload.typeId,
          referents: payload.referents,
          pilotes: payload.pilotes,
          dateDebut: payload.dateDebut,
          dateFin: payload.dateFin,
        });
      } else {
        await createAndLinkPlan({ collectiviteId, demarcheId, ...payload });
      }
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
