import { appLabels } from '@/app/labels/catalog';
import { Card, Notification, Tooltip } from '@tet/ui';
import { JSX } from 'react';
import type { DuplicatedDocumentInformation } from '../../duplicated-document-state.utils';
import { getDocumentFichier } from '../to-document-collectivite.utils';
import { DocumentRattache } from '../types';
import { useUpdatePreuveCommentaire } from '../use-edit-preuve';
import { useEditState } from '../use-edit-state';
import { useOpenPreuve } from '../use-open-preuve';
import { DocumentLastModified } from '../document-last-modified';
import { DocumentTitle } from '../document-title';
import { MissingFileBadge } from '../missing-file.badge';
import { Actions, DocumentCardActions } from './actions';
import { CommentBlock, Duplicate, Identifier, VisitDate } from './content';

const getVisitDate = (document: DocumentRattache): string | null =>
  document.preuveType === 'rapport' ? document.rapport.date : null;

const ConfidentialFileBadge = (): JSX.Element => (
  <Tooltip label={appLabels.fichierModePrive}>
    <div data-test="carte-doc-confidentiel" className="absolute -top-3 left-5">
      <Notification icon="lock-fill" size="xs" classname="w-6 h-6" />
      <span className="sr-only">{appLabels.fichierModePrive}</span>
    </div>
  </Tooltip>
);

type DocumentCardProps = {
  document: DocumentRattache;
  identifier?: string | null;
  duplicate?: DuplicatedDocumentInformation;
  actions?: DocumentCardActions;
};

export const DocumentCard = ({
  document,
  identifier,
  duplicate,
  actions,
}: DocumentCardProps): JSX.Element | null => {
  const openPreuve = useOpenPreuve({ collectiviteId: document.collectiviteId });
  const { mutate: updateCommentaire } = useUpdatePreuveCommentaire();
  const editComment = useEditState({
    initialValue: document.commentaire,
    onUpdate: (commentaire) => updateCommentaire({ ...document, commentaire }),
  });
  const fichier = getDocumentFichier(document);
  const visitDate = getVisitDate(document);

  if (document.type === 'nonRenseigne') return null;

  return (
    <div className="relative group max-w-screen-md" data-test="carte-doc">
      {fichier?.confidentiel && <ConfidentialFileBadge />}

      <Card className="p-4 h-full gap-1">
        <div className="flex items-center gap-2">
          {document.type === 'fichierManquant' && <MissingFileBadge />}
          <DocumentTitle
            document={document}
            onOpen={() => openPreuve(document)}
            withExtension
            withFilesize
          />
        </div>
        {identifier && <Identifier value={identifier} />}
        <DocumentLastModified
          modifiedAt={document.modifiedAt}
          modifiedByNom={document.modifiedByNom}
        />
        {duplicate && <Duplicate information={duplicate} />}
        <CommentBlock
          commentaire={document.commentaire}
          editComment={editComment}
        />
        {visitDate && <VisitDate date={visitDate} />}
      </Card>

      {actions && (
        <Actions
          document={document}
          actions={actions}
          editComment={editComment}
        />
      )}
    </div>
  );
};
