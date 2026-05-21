import { appLabels } from '@/app/labels/catalog';
import { FormSectionGrid, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { JSX } from 'react';

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
      subTitle={`pour toutes les actions sélectionnées`}
      render={() => (
        <FormSectionGrid>
          {children}
        </FormSectionGrid>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            children: appLabels.valider,
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
