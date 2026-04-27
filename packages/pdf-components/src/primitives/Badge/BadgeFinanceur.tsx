import { BadgeSize } from '../../ui-compat';
import { Stack } from '../Stack';
import { Badge } from './Badge';
import { BadgeBudget } from './BadgeBudget';

type BadgeFinanceurProps = {
  nom: string;
  montant: number | undefined | null;
  unite?: 'HT' | 'ETP';
  size?: BadgeSize;
  uppercase?: boolean;
};

export const BadgeFinanceur = ({
  nom,
  montant,
  unite = 'HT',
  size,
  uppercase,
}: BadgeFinanceurProps) => {
  return (
    <Stack direction="row" gap={0}>
      <Badge
        title={nom}
        variant="standard"
        uppercase={uppercase}
        size={size}
        className="rounded-r-none"
      />
      <BadgeBudget
        montant={montant}
        unite={unite}
        size={size}
        className="rounded-l-none border-l-0"
      />
    </Stack>
  );
};
