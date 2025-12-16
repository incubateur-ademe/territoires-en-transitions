import Link from 'next/link';

import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';
import { Button } from '@tet/ui';

type Props = {
  title?: string | null;
  fiche: FicheWithRelationsAndCollectivite;
};

export const FichesListCellTitle = ({ title, fiche }: Props) => {
  const currentCollectivite = useCurrentCollectivite();

  const isReadOnly =
    !!fiche.restreint && currentCollectivite.niveauAcces === null;

  const href = makeCollectiviteActionUrl({
    collectiviteId: currentCollectivite.collectiviteId,
    ficheUid: fiche.id.toString(),
  });

  if (title) {
    return <FicheTitre href={href} title={title} isReadOnly={isReadOnly} />;
  }

  return (
    <div className="group flex items-center gap-2 justify-between">
      <div className="italic text-grey-6">Sans titre</div>
      {!isReadOnly && (
        <Button
          variant="grey"
          size="xs"
          href={href}
          className="hidden group-hover:flex py-[0.1875rem] px-2 leading-none"
        >
          Ouvrir
        </Button>
      )}
    </div>
  );
};

const FicheTitre = ({
  href,
  title,
  isReadOnly,
}: {
  title: FicheWithRelationsAndCollectivite['titre'];
  href: string;
  isReadOnly: boolean;
}) => {
  const ficheTitle = generateTitle(title);

  if (isReadOnly) {
    return (
      <span
        title={ficheTitle}
        className="font-bold text-primary-9 line-clamp-2"
      >
        {ficheTitle}
      </span>
    );
  }
  return (
    <Link
      title={ficheTitle}
      className="font-bold text-primary-9 line-clamp-2 bg-none active:!bg-transparent hover:underline"
      href={href}
    >
      {ficheTitle}
    </Link>
  );
};
