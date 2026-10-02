'use client';

import { makeCollectiviteIndicateursVueUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { TabsTab } from '@tet/ui/design-system/TabsNext/index';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useListIndicateurVues } from './data/use-indicateur-vues';
import { IndicateurVueTabActions } from './indicateur-vue-tab-actions';
import { useIndicateurVueTabActionsContext } from './indicateur-vue-tab-actions.context';

export function IndicateurVuesTabs() {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const { data: vues, isError } = useListIndicateurVues();
  const { currentVueTabActions } = useIndicateurVueTabActionsContext();
  const router = useRouter();
  const pendingFiltersVueId = useRef<string | null>(null);

  useEffect(() => {
    if (
      pendingFiltersVueId.current !== null &&
      currentVueTabActions?.vue.id === pendingFiltersVueId.current
    ) {
      currentVueTabActions.openFilters();
      pendingFiltersVueId.current = null;
    }
  }, [currentVueTabActions]);

  if (isError) {
    return (
      <li role="presentation" className="text-error-1">
        <span role="alert">{appLabels.indicateurVuesLoadError}</span>
      </li>
    );
  }

  return vues?.map((vue) => {
    const isCurrentVue = currentVueTabActions?.vue.id === vue.id;
    const href = makeCollectiviteIndicateursVueUrl({
      collectiviteId,
      vueId: vue.id,
    });

    return (
      <TabsTab
        key={vue.id}
        label={vue.nom}
        href={href}
        onNavigate={() => {
          pendingFiltersVueId.current = null;
          if (isCurrentVue) currentVueTabActions.restoreFilters();
        }}
        dataTest="indicateurs.vues.tab"
        actions={
          hasCollectivitePermission('indicateurs.vues.mutate') ? (
            <IndicateurVueTabActions
              vue={vue}
              onEditFilters={() => {
                if (isCurrentVue) {
                  currentVueTabActions.openFilters();
                } else {
                  pendingFiltersVueId.current = vue.id;
                  router.push(href);
                }
              }}
            />
          ) : undefined
        }
      />
    );
  });
}
