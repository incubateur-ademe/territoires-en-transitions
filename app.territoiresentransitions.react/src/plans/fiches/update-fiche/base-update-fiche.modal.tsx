import SharedFicheActionUpdateAlert from '@/app/plans/fiches/share-fiche/shared-fiche-action-update.alert';
import { FicheResume } from '@/domain/plans/fiches';
import { Modal, ModalProps } from '@/ui';

type BaseUpdateFicheModalProps = ModalProps & {
  fiche: Pick<FicheResume, 'collectiviteNom' | 'sharedWithCollectivites'>;
};

const BaseUpdateFicheModal = (props: BaseUpdateFicheModalProps) => {
  return (
    <Modal
      {...props}
      render={(renderProps) => (
        <>
          <SharedFicheActionUpdateAlert fiche={props.fiche} />
          {props.render?.(renderProps)}
        </>
      )}
    />
  );
};
export default BaseUpdateFicheModal;
