import { Badge, BadgeBudget, Stack } from 'ui/export-pdf/components';

type BadgeFinanceurProps = {
  nom: string;
  montantTtc: number | undefined | null;
  size?: 'sm' | 'md';
  uppercase?: boolean;
  className?: string;
};

export const BadgeFinanceur = ({
  nom,
  montantTtc,
  size,
  uppercase,
  className,
}: BadgeFinanceurProps) => {
  return (
    <Stack direction="row" gap={0} className={className}>
      <Badge
        title={nom}
        state="standard"
        uppercase={uppercase}
        size={size}
        className="rounded-r-none"
      />
      <BadgeBudget
        montantTtc={montantTtc}
        size={size}
        className="rounded-l-none border-l-0"
      />
    </Stack>
  );
};
