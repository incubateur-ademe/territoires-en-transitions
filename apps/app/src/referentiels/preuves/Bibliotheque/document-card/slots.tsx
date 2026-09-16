import { appLabels } from '@/app/labels/catalog';
import {
  getTextFormattedDate,
  getTruncatedText,
} from '@/app/utils/formatUtils';
import { Button, Icon } from '@tet/ui';
import classNames from 'classnames';
import { JSX, useState } from 'react';
import type { DuplicatedDocumentInformation } from '../../duplicated-document-state.utils';
import { DocumentCardAction, isActionCarriedBy } from './action';
import { useDocumentCard } from './context';
import { EditStateInput } from '../edit-state.input';
import { DuplicatedDocumentAlert } from '../duplicated-document.alert';
import { DocumentCardMenu } from './menu';
import { getAuthorAndDate, getFormattedTitle } from '../document-label.utils';

export const Title = (): JSX.Element => {
  const { document, open } = useDocumentCard();
  const { fichier } = document;

  return (
    <span
      className="text-primary-9 hover:text-primary-8 transition text-base font-bold cursor-pointer"
      data-test="name"
      title={fichier ? appLabels.telechargerFichier : appLabels.ouvrirLien}
      onClick={open}
    >
      {getFormattedTitle(document)}
    </span>
  );
};
Title.displayName = 'DocumentCard.Title';

export const Identifier = ({
  identifiant,
}: {
  identifiant: string;
}): JSX.Element => (
  <span className="text-grey-6 leading-6 flex gap-2">{identifiant}</span>
);
Identifier.displayName = 'DocumentCard.Identifier';

export const Author = (): JSX.Element => {
  const { document } = useDocumentCard();

  return (
    <span className="text-grey-8 text-sm font-medium">
      {getAuthorAndDate(document.modifiedAt, document.modifiedByNom)}
    </span>
  );
};
Author.displayName = 'DocumentCard.Author';

export const Duplicate = ({
  information,
}: {
  information: DuplicatedDocumentInformation | undefined;
}): JSX.Element | null =>
  information ? (
    <DuplicatedDocumentAlert
      storedFilenameKept={information.storedFilenameKept}
    />
  ) : null;
Duplicate.displayName = 'DocumentCard.Duplicate';

export const Comment = ({
  className,
}: {
  className?: string;
}): JSX.Element | null => {
  const { document, editComment } = useDocumentCard();
  const [isExpanded, setIsExpanded] = useState(false);
  const { commentaire } = document;
  const { truncatedText, isTextTruncated } = getTruncatedText(commentaire, 160);

  if (editComment.isEditing) {
    return (
      <div className="flex flex-col gap-2 leading-5">
        <div className="h-px bg-primary-3" />
        <EditStateInput editElement={editComment} type="textarea" />
      </div>
    );
  }

  if (!commentaire || commentaire.length === 0) {
    return null;
  }

  const isShownInFull = isExpanded || !isTextTruncated;

  return (
    <div className="flex flex-col gap-2 leading-5">
      <div className="h-px bg-primary-3" />
      <div className="flex gap-1 items-start">
        <Icon icon="discuss-line" size="xs" className="text-grey-7 mt-0.5" />
        <span
          className={classNames(
            'text-grey-8 text-xs font-medium italic whitespace-pre-wrap',
            className
          )}
          data-test="comment"
        >
          {isShownInFull ? commentaire : truncatedText}
        </span>
      </div>
      {isTextTruncated && (
        <Button
          variant="underlined"
          size="xs"
          className="ml-auto"
          onClick={() => setIsExpanded((previous) => !previous)}
        >
          {isExpanded ? appLabels.voirMoins : appLabels.voirPlus}
        </Button>
      )}
    </div>
  );
};
Comment.displayName = 'DocumentCard.Comment';

export const VisitDate = ({ date }: { date: string }): JSX.Element => (
  <p className="text-xs text-grey-8 font-normal mb-1 pl-2">
    {appLabels.visiteEffectuee({ dateVisite: getTextFormattedDate({ date }) })}
  </p>
);
VisitDate.displayName = 'DocumentCard.VisitDate';

export const Actions = ({
  allowedActions,
}: {
  allowedActions: readonly DocumentCardAction[];
}): JSX.Element | null => {
  const { document, editComment, setOpenAction } = useDocumentCard();

  const shownActions = allowedActions.filter((action) =>
    isActionCarriedBy(action, document.preuveType)
  );
  const isShown = (action: DocumentCardAction) => shownActions.includes(action);

  if (shownActions.length === 0 || editComment.isEditing) {
    return null;
  }

  return (
    <DocumentCardMenu
      document={document}
      className="absolute top-4 right-4 invisible group-hover:visible"
      actions={{
        edit: isShown('edit') ? () => setOpenAction('edit') : undefined,
        comment: isShown('comment') ? () => editComment.enter() : undefined,
        replace: isShown('replace')
          ? () => setOpenAction('replace')
          : undefined,
        delete: isShown('delete') ? () => setOpenAction('delete') : undefined,
      }}
    />
  );
};
Actions.displayName = 'DocumentCard.Actions';
