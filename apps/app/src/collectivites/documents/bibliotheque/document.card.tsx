import { JSX, ReactNode } from 'react';
import {
  DocumentCardView,
  documentCardSlots,
} from './document-card/document-card.view';
import { DocumentRattache } from './types';
import { useRemovePreuve, useUpdatePreuveCommentaire } from './use-edit-preuve';
import { useOpenPreuve } from './use-open-preuve';

type DocumentCardProps = {
  document: DocumentRattache;
  children?: ReactNode;
};

const DocumentCardRoot = ({
  document,
  children,
}: DocumentCardProps): JSX.Element => {
  const openPreuve = useOpenPreuve({ collectiviteId: document.collectiviteId });
  const { mutate: updateCommentaire } = useUpdatePreuveCommentaire();
  const { mutate: removePreuve } = useRemovePreuve();

  return (
    <DocumentCardView
      document={document}
      onOpen={() => openPreuve(document)}
      onSaveCommentaire={(commentaire) =>
        updateCommentaire({ ...document, commentaire })
      }
      onDelete={() => removePreuve(document)}
    >
      {children}
    </DocumentCardView>
  );
};

export const DocumentCard = Object.assign(DocumentCardRoot, documentCardSlots);
