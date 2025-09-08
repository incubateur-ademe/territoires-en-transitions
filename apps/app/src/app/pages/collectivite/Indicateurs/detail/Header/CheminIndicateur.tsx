import {
  makeCollectiviteIndicateursUrl,
  makeCollectiviteTousLesIndicateursUrl,
} from '@/app/app/paths';
import { IndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { Breadcrumbs } from '@/ui';
import { pick } from 'es-toolkit';
import { useRouter } from 'next/navigation';
import { getIndicateurGroup } from '../../lists/IndicateurCard/utils';

type Props = {
  collectiviteId: number;
  indicateur: IndicateurDefinition;
};

const CheminIndicateur = ({ collectiviteId, indicateur }: Props) => {
  const router = useRouter();

  const items =
    [
      ...(indicateur.parents ?? []),
      pick(indicateur, ['id', 'titre', 'titreCourt', 'identifiantReferentiel']),
    ].map(({ id, titre, titreCourt, identifiantReferentiel }) => ({
      label: titreCourt || titre || 'Sans titre',
      url:
        id !== indicateur.id
          ? makeCollectiviteIndicateursUrl({
              collectiviteId,
              indicateurView: getIndicateurGroup(identifiantReferentiel),
              identifiantReferentiel: identifiantReferentiel,
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
