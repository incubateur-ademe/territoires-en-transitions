import { makeCollectiviteToutesLesFichesUrl } from '@/app/app/paths';
import { Breadcrumbs } from '@tet/ui';
import { useRouter } from 'next/navigation';

type NotClassifiedFicheBreadcrumbsProps = {
  title: string;
  collectiviteId: number;
};

export const NotClassifiedFicheBreadcrumbs = ({
  title,
  collectiviteId,
}: NotClassifiedFicheBreadcrumbsProps) => {
  const router = useRouter();

  return (
    <Breadcrumbs
      items={[
        {
          label: 'Actions non classées',
          onClick: () => {
            router.push(
              makeCollectiviteToutesLesFichesUrl({
                collectiviteId,
                ficheViewType: 'non-classifiees',
              })
            );
          },
        },
        {
          label: title,
        },
      ]}
    />
  );
};
