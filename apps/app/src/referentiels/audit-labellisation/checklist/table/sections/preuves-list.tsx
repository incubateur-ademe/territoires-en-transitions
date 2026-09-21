'use client';

import { getDocumentFilename } from '@tet/domain/collectivites';
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
}): ReactElement => {
  const isDownloadable = preuve.type === 'fichier';
  const isRenamable = canEdit && preuve.type === 'fichier';
  const label =
    preuve.type === 'lien' ? preuve.lien.titre : getDocumentFilename(preuve);

  return (
    <li>
      <DocumentLine
        filename={label}
        isMissing={preuve.type === 'fichierManquant'}
      >
        {isDownloadable && (
          <DownloadPreuveButton
            collectiviteId={preuve.collectiviteId}
            fichierId={preuve.fichier.id}
          />
        )}
        {isRenamable && (
          <RenamePreuveButton
            preuve={{
              collectiviteId: preuve.collectiviteId,
              preuveType: preuve.preuveType,
              fichier: preuve.fichier,
            }}
          />
        )}
        {canEdit && <DeletePreuveButton preuveId={preuve.id} />}
      </DocumentLine>
    </li>
  );
};

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
