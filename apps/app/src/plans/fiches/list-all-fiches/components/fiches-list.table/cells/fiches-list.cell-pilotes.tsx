import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { FicheWithRelationsAndCollectivite } from '@/domain/plans';

type Props = {
  pilotes: FicheWithRelationsAndCollectivite['pilotes'] | null;
};

export const FichesListCellPilotes = ({ pilotes }: Props) => {
  if (!pilotes || pilotes.length === 0) return null;

  return (
    <ListWithTooltip
      title={pilotes[0].nom}
      list={pilotes.map((p) => p.nom)}
      className="text-grey-8"
      displayedTextClassName="max-w-48 line-clamp-1"
    />
  );
};
