import { cn } from '../../utils/cn';

type Props = React.HTMLAttributes<HTMLTableRowElement>;

export const TableRow = ({ className, ...props }: Props) => (
  <tr
    className={cn(
      'group relative border-b border-grey-3 even:bg-grey-1',
      // Cache le span inséré par FloatingFocusManager
      // qui est ajouté pour récupérer le focus lorsque qu'une cellule
      // qui est ouverte (portal) en inline editing est refermée
      '[&:has([data-inline-edit="true"])>span]:hidden',
      className
    )}
    {...props}
  />
);
