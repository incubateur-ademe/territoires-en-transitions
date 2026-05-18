import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { generateTitle } from '@/app/utils/generate-title';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { Button, TableCell, Tooltip } from '@tet/ui';

type Props = {
  fiche: FicheWithRelationsAndCollectivite;
};

export const FichesListCellTitle = ({ fiche }: Props) => {
  const currentCollectivite = useCurrentCollectivite();

  const isReadOnlyIfPrivate =
    !!fiche.restreint &&
    !currentCollectivite.hasCollectivitePermission(
      'plans.fiches.read_confidentiel'
    );

  const href = makeCollectiviteActionUrl({
    collectiviteId: currentCollectivite.collectiviteId,
    ficheUid: fiche.id.toString(),
  });

  return (
    <TableCell>
      <div className="relative flex items-center gap-2 justify-between">
        <FicheTitre
          title={fiche.titre}
          isReadOnlyIfPrivate={isReadOnlyIfPrivate}
        />
        {!isReadOnlyIfPrivate && (
          <Button
            variant="grey"
            size="xs"
            href={href}
            className="hidden group-focus-within:flex group-hover:flex absolute right-0 py-1 px-2"
          >
            {appLabels.ouvrir}
          </Button>
        )}
      </div>
    </TableCell>
  );
};

const FicheTitre = ({
  title,
  isReadOnlyIfPrivate,
}: {
  title?: FicheWithRelationsAndCollectivite['titre'] | null;
  isReadOnlyIfPrivate: boolean;
}) => {
  const ficheTitle = generateTitle(title);

  if (!title) {
    return <span className="italic text-grey-6">{ficheTitle}</span>;
  }

  if (isReadOnlyIfPrivate) {
    return (
      <Tooltip label="Cette action est privée, vous ne pouvez pas y accéder">
        <span title={ficheTitle} className="font-bold text-grey-8 line-clamp-2">
          {ficheTitle}
        </span>
      </Tooltip>
    );
  }
  return (
    <span className="font-bold text-primary-9 line-clamp-2" title={ficheTitle}>
      {ficheTitle}
    </span>
  );
};
