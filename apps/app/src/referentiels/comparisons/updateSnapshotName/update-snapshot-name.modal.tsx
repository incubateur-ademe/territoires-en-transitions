import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { parseSnapshotName } from '@tet/domain/referentiels';
import { Field, Input } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
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
  const year = parsedName?.year ?? '';
  const name = parsedName?.name ?? '';
  const [editedSnapshotName, setEditedSnapshotName] = useState<string>(name);
  const { mutate: renameSnapshot } = useSnapshotUpdateName();

  if (!parsedName) return null;

  return (
    <Modal
      openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}
      size="md"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.editerNomSauvegarde}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Field title={appLabels.nomDeLaSauvegarde}>
          <div className="flex items-center border border-grey-4 rounded-lg bg-grey-1 focus-within:border-primary-5">
            <span className="text-sm px-3 py-3 text-primary-7 border-r border-grey-4">
              {year} -
            </span>
            <Input
              type="text"
              placeholder={appLabels.entrezNomSauvegarde}
              containerClassname="flex-grow border-none"
              value={editedSnapshotName}
              onChange={(e) => setEditedSnapshotName(e.target.value)}
            />
          </div>
        </Field>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={() => {
            renameSnapshot({
              collectiviteId,
              referentielId,
              snapshotRef,
              newName: `${year} - ${editedSnapshotName}`,
            });
            openState.setIsOpen(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
