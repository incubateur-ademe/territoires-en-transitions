import { appLabels } from '@/app/labels/catalog';
import { Card, Notification, Tooltip } from '@tet/ui';
import { JSX } from 'react';
import type { DuplicatedDocumentInformation } from '../../duplicated-document-state.utils';
import { getDocumentFichier } from '../to-document-collectivite.utils';
import { DocumentRattache } from '../types';
import { useUpdatePreuveCommentaire } from '../use-edit-preuve';
import { useEditState } from '../use-edit-state';
import { useOpenPreuve } from '../use-open-preuve';
import { Actions, DocumentCardActions } from './actions';
import {
  Author,
  CommentBlock,
  Duplicate,
  Identifier,
  Title,
  VisitDate,
} from './content';

const getVisitDate = (document: DocumentRattache): string | null =>
  document.preuveType === 'rapport' ? document.rapport.date : null;

type DocumentBadgeProps = {
  icon: 'error-warning-fill' | 'lock-fill';
  tooltip: string;
  name: string;
  dataTest?: string;
};

const DocumentBadge = ({
  icon,
  tooltip,
  name,
  dataTest,
}: DocumentBadgeProps): JSX.Element => (
  <Tooltip label={tooltip}>
    <div data-test={dataTest} className="absolute -top-3 left-5">
      <Notification icon={icon} size="xs" classname="w-6 h-6" />
      <span className="sr-only">{name}</span>
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
      {document.type === 'fichierManquant' && (
        <DocumentBadge
          icon="error-warning-fill"
          tooltip={appLabels.fichierIndisponibleInfo}
          name={appLabels.fichierIndisponible}
        />
      )}
      {fichier?.confidentiel && (
        <DocumentBadge
          icon="lock-fill"
          tooltip={appLabels.fichierModePrive}
          name={appLabels.fichierModePrive}
          dataTest="carte-doc-confidentiel"
        />
      )}

      <Card className="p-4 h-full gap-1">
        <Title document={document} onOpen={() => openPreuve(document)} />
        {identifier && <Identifier value={identifier} />}
        <Author document={document} />
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
