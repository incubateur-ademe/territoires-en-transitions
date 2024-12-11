import { FormSectionGrid, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';

type ActionsGroupeesModaleProps = {
  children: JSX.Element;
  openState: OpenState;
  title: string;
  actionsCount: number;
  onSave: () => void;
};

const ActionsGroupeesModale = ({
  children,
  actionsCount,
  onSave,
  ...props
}: ActionsGroupeesModaleProps) => {
  return (
    <Modal
      {...props}
      subTitle={`Sur les ${actionsCount} fiches sélectionnées`}
      render={({ descriptionId }) => (
        <FormSectionGrid formSectionId={descriptionId}>
          {children}
        </FormSectionGrid>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            children: `Modifier les ${actionsCount} fiches`,
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
