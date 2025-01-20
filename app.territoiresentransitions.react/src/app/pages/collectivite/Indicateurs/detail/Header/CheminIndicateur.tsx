import { makeCollectiviteTousLesIndicateursUrl } from '@/app/app/paths';
import { Breadcrumbs } from '@/ui';
import { useRouter } from 'next/navigation';

type Props = {
  collectiviteId: number;
  titre: string;
  unite: string;
};

const CheminIndicateur = ({ collectiviteId, titre, unite }: Props) => {
  const router = useRouter();

  return (
    <Breadcrumbs
      size="sm"
      items={[
        {
          label: 'Tous les indicateurs',
          onClick: () =>
            router.push(
              makeCollectiviteTousLesIndicateursUrl({
                collectiviteId,
              })
            ),
        },
        {
          label: `${titre}${unite ? ` (${unite})` : ''}` || 'Sans titre',
        },
      ]}
    />
  );
};

export default CheminIndicateur;
