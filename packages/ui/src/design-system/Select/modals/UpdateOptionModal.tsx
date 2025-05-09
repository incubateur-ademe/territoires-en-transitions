import { Field, Input, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';

type UpdateOptionModalProps = {
  openState: OpenState;
  tagName: string;
  title?: string;
  fieldTitle?: string;
  onSave: (tagName: string) => void;
};

export const UpdateOptionModal = ({
  openState,
  title,
  fieldTitle,
  onSave,
  ...props
}: UpdateOptionModalProps) => {
  const [tagName, setTagName] = useState(props.tagName);

  return (
    <Modal
      openState={openState}
      title={title ?? "Éditer l'option"}
      render={() => (
        <Field title={fieldTitle ?? "Nom de l'option"}>
          <Input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            autoFocus
          />
        </Field>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              onSave(tagName);
              close();
            },
          }}
        />
      )}
    />
  );
};
