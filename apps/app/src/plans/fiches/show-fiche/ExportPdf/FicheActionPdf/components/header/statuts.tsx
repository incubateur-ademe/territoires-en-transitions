import {
  BadgePriorite,
  BadgeStatut,
  Stack,
} from '@/app/ui/export-pdf/components';
import { Priorite, Statut } from '@tet/domain/plans';

type StatuTsProps = {
  statut?: Statut | null;
  niveauPriorite?: Priorite | null;
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
