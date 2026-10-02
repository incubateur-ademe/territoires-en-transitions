import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { IndicateurVueFilters } from '@tet/domain/indicateurs';
import { Button, Modal } from '@tet/ui';
import { useState } from 'react';
import {
  IndicateurVue,
  useCreateIndicateurVue,
  useUpdateIndicateurVue,
} from './data/use-indicateur-vues';
import { areIndicateurVueFiltersEqual } from './indicateur-vue-filters.rules';
import { IndicateurVueNameForm } from './indicateur-vue-name.form';

type Props = {
  filters: IndicateurVueFilters;
  vue?: IndicateurVue;
  onOpenVue?: (vue: IndicateurVue) => void;
  onSaveVueFilters?: (vue: IndicateurVue) => void;
};

export function IndicateurVueActions({
  filters,
  vue,
  onOpenVue,
  onSaveVueFilters,
}: Props) {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const createMutation = useCreateIndicateurVue();
  const updateMutation = useUpdateIndicateurVue();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (!hasCollectivitePermission('indicateurs.vues.mutate')) return null;

  const hasUnsavedChanges =
    vue?.filtres != null && !areIndicateurVueFiltersEqual(filters, vue.filtres);

  if (vue && !hasUnsavedChanges) return null;

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const hasFilters = Object.keys(filters).length > 0;

  const createVue = async (nom: string) => {
    try {
      const saved = await createMutation.mutateAsync({
        collectiviteId,
        nom,
        filtres: filters,
      });
      setIsCreateOpen(false);
      onOpenVue?.(saved);
      return true;
    } catch {
      // Mutation errors are displayed by the global toast subscriber.
      return false;
    }
  };

  const saveVueFilters = async () => {
    if (!vue) return;

    try {
      const saved = await updateMutation.mutateAsync({
        collectiviteId,
        id: vue.id,
        filtres: filters,
      });
      onSaveVueFilters?.(saved);
    } catch {
      // Mutation errors are displayed by the global toast subscriber.
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {hasUnsavedChanges && (
        <Button
          size="xs"
          disabled={isMutating}
          data-test="indicateurs.vues.save"
          onClick={saveVueFilters}
        >
          {appLabels.indicateurVueSaveChanges}
        </Button>
      )}
      <Button
        size="xs"
        variant={hasUnsavedChanges ? 'outlined' : 'primary'}
        disabled={isMutating || !hasFilters}
        data-test="indicateurs.vues.create"
        onClick={() => setIsCreateOpen(true)}
      >
        {appLabels.indicateurVueCreateFromChanges}
      </Button>
      {isCreateOpen && (
        <Modal
          title={appLabels.indicateurVueCreateFromChanges}
          openState={{ isOpen: isCreateOpen, setIsOpen: setIsCreateOpen }}
          disableDismiss={isMutating}
          render={() => (
            <IndicateurVueNameForm
              onCancel={() => setIsCreateOpen(false)}
              onSubmit={createVue}
            />
          )}
        />
      )}
    </div>
  );
}
