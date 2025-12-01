import { SharedFicheUpdateAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-update.alert';
import { Modal, ModalProps } from '@tet/ui';
import { FicheShareProperties } from '../share-fiche/fiche-share-properties.dto';

type BaseUpdateFicheModalProps = ModalProps & {
  fiche: FicheShareProperties;
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
