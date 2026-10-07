import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui';
import {
  IndicateurVue,
  useUpdateIndicateurVue,
} from './data/use-indicateur-vues';
import { IndicateurVueNameForm } from './indicateur-vue-name.form';

export function RenameIndicateurVueModal({
  vue,
  onClose,
}: {
  vue: IndicateurVue;
  onClose: () => void;
}) {
  const updateVue = useUpdateIndicateurVue();

  return (
    <Modal
      title={appLabels.modifierTitre}
      openState={{ isOpen: true, setIsOpen: onClose }}
      disableDismiss={updateVue.isPending}
      render={() => (
        <IndicateurVueNameForm
          nom={vue.nom}
          onCancel={onClose}
          onSubmit={async (nom) => {
            try {
              await updateVue.mutateAsync({
                collectiviteId: vue.collectiviteId,
                id: vue.id,
                nom,
              });
              onClose();
              return true;
            } catch {
              return false;
            }
          }}
        />
      )}
    />
  );
}
