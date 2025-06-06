import { TFicheActionNiveauxPriorite } from '@/app/types/alias';
import {
  BadgePriorite,
  BadgeStatut,
  Stack,
} from '@/app/ui/export-pdf/components';
import { Statut } from '@/domain/plans/fiches';

type StatuTsProps = {
  statut?: Statut | null;
  niveauPriorite?: TFicheActionNiveauxPriorite | null;
};

export const Statuts = ({ statut, niveauPriorite }: StatuTsProps) => {
  if (!statut && !niveauPriorite) return null;

  return (
    <Stack direction="row" gap={2}>
      {!!statut && <BadgeStatut statut={statut} />}
      {!!niveauPriorite && <BadgePriorite priorite={niveauPriorite} />}
    </Stack>
  );
};
