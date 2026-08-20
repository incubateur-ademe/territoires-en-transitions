'use client';

import { appLabels } from '@/app/labels/catalog';
import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import type { PersonneId } from '@tet/domain/collectivites';
import { Button, Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

export type DemarcheCreatePlanPayload = {
  nom: string;
  referents?: PersonneId[];
  pilotes?: PersonneId[];
  dateDebut?: string | null;
  dateFin?: string | null;
};

type Props = {
  openState: OpenState;
  /**
   * Crée le plan et le rattache à la démarche (le type de plan est imposé
   * côté serveur, d'où l'absence du champ). true ferme la modale.
   */
  onCreatePlan: (payload: DemarcheCreatePlanPayload) => Promise<boolean>;
};

export const DemarcheCreatePlanModal = ({ openState, onCreatePlan }: Props) => (
  <Modal
    size="lg"
    title={appLabels.demarcheProgrammeCreerNouveauPlanFromZero}
    openState={openState}
    dataTest="demarches.plan.create-plan-modal"
    render={({ close }) => (
      <UpsertPlanForm
        showTypeField={false}
        onSubmit={async (data) => {
          const ok = await onCreatePlan({
            nom: data.nom,
            referents: data.referents ?? undefined,
            pilotes: data.pilotes ?? undefined,
            dateDebut: data.dateDebut,
            dateFin: data.dateFin,
          });
          if (ok) {
            close();
          }
          return ok;
        }}
        cancelButton={
          <Button variant="outlined" type="button" onClick={close}>
            {appLabels.annuler}
          </Button>
        }
      />
    )}
  />
);
