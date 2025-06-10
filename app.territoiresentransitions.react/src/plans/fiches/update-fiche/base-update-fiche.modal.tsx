import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { SharedFicheUpdateAlert } from '@/app/plans/fiches/share-fiche/shared-fiche-update.alert';
import { Modal, ModalProps } from '@/ui';

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
