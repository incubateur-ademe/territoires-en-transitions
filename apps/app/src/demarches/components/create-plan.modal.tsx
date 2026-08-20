'use client';

import { appLabels } from '@/app/labels/catalog';
import { UpsertPlanForm } from '@/app/plans/plans/upsert-plan/upsert-plan.form';
import type { PersonneId } from '@tet/domain/collectivites';
import { Button, Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';

export type DemarcheCreatePlanPayload = {
  nom: string;
  typeId?: number;
  referents?: PersonneId[];
  pilotes?: PersonneId[];
  dateDebut?: string | null;
  dateFin?: string | null;
};

type Props = {
  openState: OpenState;
  /** Type de plan attendu par la démarche, pré-sélectionné dans le formulaire. */
  defaultTypeId: number | undefined;
  /**
   * Crée le plan et le rattache à la démarche. true ferme la modale.
   */
  onCreatePlan: (payload: DemarcheCreatePlanPayload) => Promise<boolean>;
};

export const DemarcheCreatePlanModal = ({
  openState,
  defaultTypeId,
  onCreatePlan,
}: Props) => (
  <Modal
    size="lg"
    title={appLabels.demarcheProgrammeCreerNouveauPlanFromZero}
    openState={openState}
    dataTest="demarches.plan.create-plan-modal"
    render={({ close }) => (
      <UpsertPlanForm
        // Le contenu n'est monté qu'à l'ouverture : le type attendu est déjà
        // résolu, mais l'utilisateur reste libre d'en choisir un autre.
        defaultValues={{ nom: '', typeId: defaultTypeId ?? null }}
        onSubmit={async (data) => {
          const ok = await onCreatePlan({
            nom: data.nom,
            typeId: data.typeId ?? undefined,
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
