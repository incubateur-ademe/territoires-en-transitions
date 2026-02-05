import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { useGetFiche } from '@/app/plans/fiches/show-fiche/data/use-get-fiche';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { TableCell } from '@tet/ui';
import Link from 'next/link';

type Props = {
  parentId?: FicheWithRelations['parentId'];
};

export const SousActionActionParenteCell = ({ parentId }: Props) => {
  return (
    <TableCell>
      {parentId ? <Cell parentId={parentId} /> : <Placeholder />}
    </TableCell>
  );
};

const Cell = ({
  parentId,
}: {
  parentId: NonNullable<FicheWithRelations['parentId']>;
}) => {
  const { collectiviteId } = useCurrentCollectivite();

  const { data: parent } = useGetFiche({ id: parentId });

  const href = makeCollectiviteActionUrl({
    collectiviteId,
    ficheUid: parentId.toString(),
  });

  if (!parent) return <Placeholder />;

  return (
    <Link
      className="text-grey-8 line-clamp-1 bg-none active:!bg-transparent hover:underline"
      href={href}
      title={generateTitle(parent?.titre)}
    >
      {generateTitle(parent?.titre)}
    </Link>
  );
};

const Placeholder = () => (
  <span className="text-grey-6">Action introuvable</span>
);
