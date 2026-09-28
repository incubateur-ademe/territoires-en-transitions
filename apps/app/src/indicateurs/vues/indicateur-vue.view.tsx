'use client';

import IndicateursListView from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-view';
import { makeCollectiviteIndicateursListUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { ErrorCard } from '@/app/utils/error/error.card';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useListIndicateurVues } from './data/use-indicateur-vues';
import { IndicateurVueDeleteButton } from './indicateur-vue-delete.button';

export function IndicateurVueView({ vueId }: { vueId: string }) {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const { data: vues, isPending, error, refetch } = useListIndicateurVues();
  const canRead = hasCollectivitePermission('indicateurs.vues.read');
  const vue = vues?.find((vue) => vue.id === vueId);

  if (canRead && isPending) return <SpinnerLoader />;

  if (!canRead || error || !vue || vue.filtres === null) {
    return (
      <div className="flex flex-col items-start gap-4">
        <ErrorCard
          title={appLabels.indicateurVueUnavailable}
          subTitle={appLabels.indicateurVueUnavailableDescription}
          error={error ?? undefined}
          retry={canRead ? () => void refetch() : undefined}
        />
        {canRead && vue && <IndicateurVueDeleteButton vue={vue} />}
        <Button
          data-test="indicateurs.vues.back-to-list"
          href={makeCollectiviteIndicateursListUrl({
            collectiviteId,
            listId: 'tous',
          })}
          variant="outlined"
        >
          {appLabels.indicateurTous}
        </Button>
      </div>
    );
  }

  return <IndicateursListView key={vue.id} listId="tous" vue={vue} />;
}
