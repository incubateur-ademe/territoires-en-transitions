import Link from 'next/link';

import { useCurrentCollectivite } from '@/api/collectivites';
import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { getFichePageUrlForCollectivite } from '@/app/plans/fiches/get-fiche/get-fiche-page-url.util';
import { FicheWithRelationsAndCollectivite } from '@/domain/plans';
import { Button } from '@/ui';

type Props = {
  title?: string | null;
  fiche: FicheWithRelationsAndCollectivite;
};

export const FichesListCellTitle = ({ title, fiche }: Props) => {
  const currentCollectivite = useCurrentCollectivite();

  const isClickable =
    !fiche.restreint || currentCollectivite.niveauAcces !== null;

  const href = getFichePageUrlForCollectivite({
    fiche,
    collectiviteId: fiche.collectiviteId,
  });

  if (title) {
    return (
      <div className="flex">
        {isClickable ? (
          <Link
            title={generateTitle(title)}
            className="font-bold text-primary-9 line-clamp-2 bg-none active:!bg-transparent hover:underline"
            href={href}
          >
            {generateTitle(title)}
          </Link>
        ) : (
          <span
            title={generateTitle(title)}
            className="font-bold text-primary-9 line-clamp-2"
          >
            {generateTitle(title)}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-2 justify-between">
      <div className="italic text-grey-6">Sans titre</div>
      {isClickable && (
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
