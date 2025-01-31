import {
  makeCollectiviteIndicateursUrl,
  makeCollectiviteTousLesIndicateursUrl,
} from '@/app/app/paths';
import { Breadcrumbs } from '@/ui';
import { useRouter } from 'next/navigation';
import { useIndicateurPath } from '../../data/use-indicateur-path';
import { getIndicateurGroup } from '../../lists/IndicateurCard/utils';

type Props = {
  collectiviteId: number;
  indicateurId: number;
};

const CheminIndicateur = ({ collectiviteId, indicateurId }: Props) => {
  const router = useRouter();
  const { data } = useIndicateurPath({ collectiviteId, indicateurId });

  const items =
    data?.map(({ id, titre, identifiant }) => ({
      label: titre || 'Sans titre',
      url:
        id !== indicateurId
          ? makeCollectiviteIndicateursUrl({
              collectiviteId,
              indicateurView: getIndicateurGroup(identifiant),
              identifiantReferentiel: identifiant,
              indicateurId: id,
            })
          : undefined,
    })) || [];

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
        ...items.map(({ label, url }) => ({
          label,
          onClick: () => url && router.push(url),
        })),
      ]}
    />
  );
};

export default CheminIndicateur;
