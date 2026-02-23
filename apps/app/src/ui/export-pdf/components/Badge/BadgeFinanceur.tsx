import { Badge, BadgeBudget, Stack } from '@/app/ui/export-pdf/components';
import { BadgeSize } from '@tet/ui';

type BadgeFinanceurProps = {
  nom: string;
  montant: number | undefined | null;
  unite?: 'HT' | 'ETP';
  size?: BadgeSize;
  uppercase?: boolean;
  className?: string;
};

export const BadgeFinanceur = ({
  nom,
  montant,
  unite = 'HT',
  size,
  uppercase,
  className,
}: BadgeFinanceurProps) => {
  return (
    <Stack direction="row" gap={0} className={className}>
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
