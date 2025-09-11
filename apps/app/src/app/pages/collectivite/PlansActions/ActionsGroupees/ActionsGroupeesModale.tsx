import { FormSectionGrid, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';

type ActionsGroupeesModaleProps = {
  children: JSX.Element;
  openState: OpenState;
  title: string;
  onSave: () => void;
};

const ActionsGroupeesModale = ({
  children,
  onSave,
  ...props
}: ActionsGroupeesModaleProps) => {
  return (
    <Modal
      {...props}
      subTitle={`pour toutes les fiches sélectionnées`}
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {children}
        </FormSectionGrid>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            children: `Valider`,
            onClick: () => {
              close();
              onSave();
            },
          }}
        />
      )}
    />
  );
};

export default ActionsGroupeesModale;
