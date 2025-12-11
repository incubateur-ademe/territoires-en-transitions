import { SharedFicheUpdateAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-update.alert';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal, ModalProps } from '@tet/ui';

type BaseUpdateFicheModalProps = ModalProps & {
  fiche: FicheWithRelations;
};

const BaseUpdateFicheModal = (props: BaseUpdateFicheModalProps) => {
  return (
    <Modal
      {...props}
      render={(renderProps) => (
        <>
          <SharedFicheUpdateAlert fiche={props.fiche} />
          {props.render?.(renderProps)}
        </>
      )}
    />
  );
};
export default BaseUpdateFicheModal;
