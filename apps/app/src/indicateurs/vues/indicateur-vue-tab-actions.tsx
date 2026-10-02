'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ButtonMenu, Modal } from '@tet/ui';
import { useState } from 'react';
import {
  IndicateurVue,
  useUpdateIndicateurVue,
} from './data/use-indicateur-vues';
import { IndicateurVueDeleteButton } from './indicateur-vue-delete.button';
import { IndicateurVueNameForm } from './indicateur-vue-name.form';

export function IndicateurVueTabActions({
  vue,
  onEditFilters,
}: {
  vue: IndicateurVue;
  onEditFilters: () => void;
}) {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const update = useUpdateIndicateurVue();
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  if (!hasCollectivitePermission('indicateurs.vues.mutate')) return null;

  return (
    <>
      <ButtonMenu
        size="xs"
        variant="white"
        icon="more-2-fill"
        title={appLabels.indicateurVueActions}
        data-test="indicateurs.vues.actions"
        className="border-0 rounded !p-1 bg-transparent"
        menu={{
          placement: 'bottom-start',
          className: 'min-w-56',
          actions: [
            {
              label: appLabels.indicateurVueEditFilters,
              icon: 'equalizer-line',
              onClick: onEditFilters,
            },
            {
              label: appLabels.modifierTitre,
              icon: 'edit-line',
              onClick: () => setIsRenameOpen(true),
            },
          ],
          endContent: (
            <IndicateurVueDeleteButton
              vue={vue}
              disabled={update.isPending}
              className="w-full gap-3 rounded border-0 bg-transparent px-3 py-2 text-sm font-normal hover:!bg-error-2 hover:!text-error-1"
            />
          ),
        }}
      />
      {isRenameOpen && (
        <Modal
          title={appLabels.modifierTitre}
          openState={{ isOpen: true, setIsOpen: setIsRenameOpen }}
          disableDismiss={update.isPending}
          render={() => (
            <IndicateurVueNameForm
              nom={vue.nom}
              onCancel={() => setIsRenameOpen(false)}
              onSubmit={async (nom) => {
                try {
                  await update.mutateAsync({
                    collectiviteId: vue.collectiviteId,
                    id: vue.id,
                    nom,
                  });
                  setIsRenameOpen(false);
                  return true;
                } catch {
                  return false;
                }
              }}
            />
          )}
        />
      )}
    </>
  );
}
