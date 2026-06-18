import { appLabels } from '@/app/labels/catalog';
import DeleteButton from '@/app/ui/buttons/DeleteButton';

type DeleteDocumentActionProps = {
  onDelete: () => void;
};

export const DeleteDocumentAction = ({
  onDelete,
}: DeleteDocumentActionProps) => (
  <DeleteButton
    data-test="btn-delete"
    title={appLabels.supprimer}
    size="xs"
    onClick={onDelete}
  />
);
