import { parseSnapshotName } from '@/domain/referentiels';
import { Field, Input, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';
import { useCollectiviteId } from '../../../collectivites/collectivite-context';
import { useReferentielId } from '../../referentiel-context';
import { useSnapshotUpdateName } from '../../use-snapshot';

export type UpdateSnapshotNameModalProps = {
  snapshotName: string;
  snapshotRef: string;
  openState: OpenState;
};

export const UpdateSnapshotNameModal = ({
  snapshotName,
  snapshotRef,
  openState,
}: UpdateSnapshotNameModalProps) => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  const parsedName = parseSnapshotName(snapshotName);
  if (!parsedName) return null;
  const { year, name } = parsedName;

  const [editedSnapshotName, setEditedSnapshotName] = useState<string>(name);

  const { mutate: renameSnapshot } = useSnapshotUpdateName();
  const handleRenameSnapshot = (snapshotRef: string) => {
    renameSnapshot({
      collectiviteId,
      referentielId,
      snapshotRef,
      newName: `${year} - ${editedSnapshotName}`,
    });
  };

  return (
    <>
      <Modal
        title="Éditer le nom d'une sauvegarde"
        size="md"
        openState={openState}
        render={({ descriptionId }) => (
          <div id={descriptionId} className="space-y-6">
            <Field title="Nom de la sauvegarde">
              <div className="flex items-center border border-grey-4 rounded-lg bg-grey-1 focus-within:border-primary-5">
                <span className="text-sm px-3 py-3 text-primary-7 border-r border-grey-4">
                  {year} -
                </span>
                <Input
                  type="text"
                  placeholder="Entrez le nom de la sauvegarde"
                  containerClassname="flex-grow border-none"
                  value={editedSnapshotName}
                  onChange={(e) => setEditedSnapshotName(e.target.value)}
                />
              </div>
            </Field>
          </div>
        )}
        renderFooter={({ close }) => (
          <ModalFooterOKCancel
            btnCancelProps={{ onClick: close }}
            btnOKProps={{
              children: `Valider`,
              onClick: () => {
                handleRenameSnapshot(snapshotRef);
                close();
              },
            }}
          />
        )}
      />
    </>
  );
};
