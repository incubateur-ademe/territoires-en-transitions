'use client';

import { ReactElement } from 'react';
import { ChecklistPreuve } from './checklist-preuve';
import { DeletePreuveButton } from './delete-preuve-button';
import { DocumentLine } from './document-line';
import { DownloadPreuveButton } from './download-preuve-button';
import { RenamePreuveButton } from './rename-preuve-button';

const PreuveLine = ({
  preuve,
  canEdit,
}: {
  preuve: ChecklistPreuve;
  canEdit: boolean;
}): ReactElement => (
  <li>
    <DocumentLine filename={preuve.fichier?.filename}>
      {preuve.fichier && <DownloadPreuveButton fichier={preuve.fichier} />}
      {canEdit && (
        <>
          <RenamePreuveButton preuve={preuve} />
          <DeletePreuveButton preuveId={preuve.id} />
        </>
      )}
    </DocumentLine>
  </li>
);

export const PreuvesList = ({
  preuves,
  canEdit,
}: {
  preuves: readonly ChecklistPreuve[];
  canEdit: boolean;
}): ReactElement | null => {
  if (preuves.length === 0) {
    return null;
  }

  return (
    <ul className="m-0 flex flex-col gap-1">
      {preuves.map((preuve) => (
        <PreuveLine key={preuve.id} preuve={preuve} canEdit={canEdit} />
      ))}
    </ul>
  );
};
