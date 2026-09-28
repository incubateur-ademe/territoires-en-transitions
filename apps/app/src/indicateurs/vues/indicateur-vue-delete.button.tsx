import {
  makeCollectiviteIndicateursListUrl,
  makeCollectiviteIndicateursVueUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { usePathname, useRouter } from 'next/navigation';
import {
  IndicateurVue,
  useDeleteIndicateurVue,
} from './data/use-indicateur-vues';

export function IndicateurVueDeleteButton({
  vue,
  disabled = false,
  className,
}: {
  vue: IndicateurVue;
  disabled?: boolean;
  className?: string;
}) {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const remove = useDeleteIndicateurVue();
  const router = useRouter();
  const pathname = usePathname();

  if (!hasCollectivitePermission('indicateurs.vues.mutate')) return null;

  const deleteVue = async (close: () => void) => {
    try {
      // L'invalidation peut démonter ce bouton lorsque la vue disparaît :
      // attendre la mutation plutôt qu'un callback lié à cet observateur.
      await remove.mutateAsync({
        collectiviteId: vue.collectiviteId,
        id: vue.id,
      });
      close();
      if (
        pathname ===
        makeCollectiviteIndicateursVueUrl({
          collectiviteId: vue.collectiviteId,
          vueId: vue.id,
        })
      ) {
        router.replace(
          makeCollectiviteIndicateursListUrl({
            collectiviteId: vue.collectiviteId,
            listId: 'tous',
          })
        );
      }
    } catch {
      // Le subscriber global affiche l'erreur et la confirmation reste ouverte.
    }
  };

  return (
    <Modal
      title={appLabels.indicateurVueDelete}
      disableDismiss={remove.isPending}
      render={() => <p>{appLabels.indicateurVueDeleteDescription(vue.nom)}</p>}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            'data-test': 'indicateurs.vues.cancel-delete',
            onClick: close,
            disabled: remove.isPending,
          }}
          btnOKProps={{
            children: appLabels.supprimer,
            disabled: remove.isPending,
            'data-test': 'indicateurs.vues.confirm-delete',
            onClick: () => void deleteVue(close),
          }}
        />
      )}
    >
      <DeleteButton
        size="xs"
        className={className}
        disabled={disabled || remove.isPending}
        data-test="indicateurs.vues.delete"
      >
        {appLabels.indicateurVueDelete}
      </DeleteButton>
    </Modal>
  );
}
