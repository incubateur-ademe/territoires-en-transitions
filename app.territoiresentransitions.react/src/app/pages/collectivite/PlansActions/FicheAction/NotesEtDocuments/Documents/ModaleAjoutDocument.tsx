import {Modal} from '@tet/ui';
import {AddPreuveModal} from 'ui/shared/preuves/AddPreuveModal';
import {useAddAnnexe} from '../../data/useAddAnnexe';

type ModaleAjoutDocumentProps = {
  ficheId: number;
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
};

const ModaleAjoutDocument = ({
  ficheId,
  isOpen,
  setIsOpen,
}: ModaleAjoutDocumentProps) => {
  const handlers = useAddAnnexe(ficheId);

  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Ajouter un document"
      size="lg"
      render={({descriptionId, close}) => (
        <div id={descriptionId}>
          <AddPreuveModal onClose={close} handlers={handlers} />
        </div>
      )}
    />
  );
};

export default ModaleAjoutDocument;
