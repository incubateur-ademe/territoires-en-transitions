import { appLabels } from '@/app/labels/catalog';
import {
  getTextFormattedDate,
  getTruncatedText,
} from '@/app/utils/formatUtils';
import { Button, Icon } from '@tet/ui';
import { JSX, useState } from 'react';
import type { DuplicatedDocumentInformation } from '../../duplicated-document-state.utils';
import { getAuthorAndDate, getFormattedTitle } from '../document-label.utils';
import { DuplicatedDocumentAlert } from '../duplicated-document.alert';
import { EditStateInput } from '../edit-state.input';
import { Preuve } from '../types';
import { EditState } from '../use-edit-state';

export const Title = ({
  document,
  onOpen,
}: {
  document: Preuve;
  onOpen: () => void;
}): JSX.Element => {
  if (document.type === 'fichierManquant') {
    return (
      <span className="text-grey-7 text-base font-bold" data-test="name">
        {getFormattedTitle(document)}
      </span>
    );
  }

  const openLabel =
    document.type === 'lien'
      ? appLabels.ouvrirLien
      : appLabels.telechargerFichier;

  return (
    <span
      className="text-primary-9 hover:text-primary-8 transition text-base font-bold cursor-pointer"
      data-test="name"
      title={openLabel}
      onClick={onOpen}
    >
      {getFormattedTitle(document)}
    </span>
  );
};

export const Identifier = ({ value }: { value: string }): JSX.Element => (
  <span className="text-grey-6 leading-6 flex gap-2">{value}</span>
);
Identifier.displayName = 'DocumentCard.Identifier';

export const Duplicate = ({
  information,
}: {
  information: DuplicatedDocumentInformation;
}): JSX.Element => (
  <DuplicatedDocumentAlert
    storedFilenameKept={information.storedFilenameKept}
  />
);
Duplicate.displayName = 'DocumentCard.Duplicate';

export const Author = ({ document }: { document: Preuve }): JSX.Element => (
  <span className="text-grey-8 text-sm font-medium">
    {getAuthorAndDate(document.modifiedAt, document.modifiedByNom)}
  </span>
);

export const CommentBlock = ({
  commentaire,
  editComment,
}: {
  commentaire: string | null;
  editComment: EditState;
}): JSX.Element | null => {
  const [isExpanded, setIsExpanded] = useState(false);
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
          className="text-grey-8 text-xs font-medium italic whitespace-pre-wrap"
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

export const VisitDate = ({ date }: { date: string }): JSX.Element => (
  <p className="text-xs text-grey-8 font-normal mb-1 pl-2">
    {appLabels.visiteEffectuee({ dateVisite: getTextFormattedDate({ date }) })}
  </p>
);
