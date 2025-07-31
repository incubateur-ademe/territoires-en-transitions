import { makeCollectiviteFichesNonClasseesUrl } from '@/app/app/paths';
import { Breadcrumbs } from '@/ui';
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
          label: 'Fiches non classées',
          onClick: () => {
            router.push(
              makeCollectiviteFichesNonClasseesUrl({ collectiviteId })
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
