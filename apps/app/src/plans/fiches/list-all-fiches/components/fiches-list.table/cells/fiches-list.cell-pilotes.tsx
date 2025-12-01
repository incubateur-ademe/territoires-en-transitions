import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';

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
      renderFirstItem={(item) => (
        <span className="max-w-48 line-clamp-1">{item}</span>
      )}
    />
  );
};
