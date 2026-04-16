import { appLabels } from '@/app/labels/catalog';
import {
  getTextFormattedDate,
  getTruncatedText,
} from '@/app/utils/formatUtils';
import { Button, Card, Icon, Notification, Tooltip } from '@tet/ui';
import classNames from 'classnames';
import { useState } from 'react';
import AlerteSuppression from './AlerteSuppression';
import DocumentInput from './DocumentInput';
import MenuCarteDocument from './MenuCarteDocument';
import { openPreuve } from './openPreuve';
import { TPreuve } from './types';
import { useEditPreuve } from './useEditPreuve';
import { getAuthorAndDate, getFormattedTitle } from './utils';

type CarteDocumentProps = {
  isReadonly: boolean;
  document: TPreuve;
  displayIdentifier?: boolean;
  classComment?: string;
};

const CarteDocument = ({
  isReadonly,
  document,
  displayIdentifier,
  classComment,
}: CarteDocumentProps) => {
  const {
    commentaire,
    created_at: dateCreation,
    created_by_nom: auteur,
    fichier,
    lien,
    action,
    rapport,
  } = document;
  const dateVisite = rapport?.date;

  const handlers = useEditPreuve(document);
  const { remove, editComment } = handlers;

  const [isDeleting, setIsDeleting] = useState(false);
  const [isFullCommentaire, setIsFullCommentaire] = useState(false);
  const isEditing = editComment.isEditing;

  const { truncatedText: truncatedCom, isTextTruncated: isComTruncated } =
    getTruncatedText(commentaire, 160);

  if (!fichier && !lien) return null;

  return (
    <>
      <div
        className={classNames('relative group max-w-screen-md')}
        data-test="carte-doc"
      >
        {fichier?.confidentiel && (
          <Tooltip label={appLabels.documentModePrive}>
            <div
              data-test="carte-doc-confidentiel"
              className="absolute -top-3 left-5"
            >
              <Notification icon="lock-fill" size="xs" classname="w-6 h-6" />
            </div>
          </Tooltip>
        )}
        {!isReadonly && !isEditing && (
          <MenuCarteDocument
            document={document}
            className="absolute top-4 right-4 invisible group-hover:visible"
            onComment={() => editComment.enter()}
            onDelete={() => setIsDeleting(true)}
          />
        )}

        <Card className="p-4 h-full gap-1">
          <span
            className="text-primary-9 hover:text-primary-8 transition text-base font-bold cursor-pointer"
            data-test="name"
            title={
              fichier ? appLabels.telechargerFichier : appLabels.ouvrirLien
            }
            onClick={() => openPreuve(document)}
          >
            {getFormattedTitle(document)}
          </span>

          {displayIdentifier && action && (
            <span className="text-grey-6 leading-6 flex gap-2">
              {action.identifiant}
            </span>
          )}

          <span className="text-grey-8 text-sm font-medium">
            {getAuthorAndDate(dateCreation, auteur)}
          </span>

          {!editComment.isEditing ? (
            !!commentaire &&
            commentaire.length > 0 && (
              <div className="flex flex-col gap-2 leading-5">
                <div className="h-px bg-primary-3" />
                <div className="flex gap-1 items-start">
                  <Icon
                    icon="discuss-line"
                    size="xs"
                    className="text-grey-7 mt-0.5"
                  />
                  <span
                    className={classNames(
                      'text-grey-8 text-xs font-medium italic whitespace-pre-wrap',
                      classComment
                    )}
                    data-test="comment"
                  >
                    {isFullCommentaire || !isComTruncated
                      ? commentaire
                      : truncatedCom}
                  </span>
                </div>
                {isComTruncated && (
                  <Button
                    variant="underlined"
                    size="xs"
                    className="ml-auto"
                    onClick={() =>
                      setIsFullCommentaire((prevState) => !prevState)
                    }
                  >
                    {isFullCommentaire
                      ? appLabels.voirMoins
                      : appLabels.voirPlus}
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-2 leading-5">
              <div className="h-px bg-primary-3" />
              <DocumentInput editElement={editComment} type="textarea" />
            </div>
          )}

          {!!dateVisite && (
            <p className="text-xs text-grey-8 font-normal mb-1 pl-2">
              {appLabels.visiteEffectuee({
                dateVisite: getTextFormattedDate({ date: dateVisite }),
              })}
            </p>
          )}
        </Card>
      </div>

      {isDeleting && !isReadonly && (
        <AlerteSuppression
          isOpen={true}
          setIsOpen={setIsDeleting}
          title={appLabels.supprimerDocument}
          message={appLabels.supprimerDocumentMessage}
          onDelete={() => {
            remove();
          }}
        />
      )}
    </>
  );
};

export default CarteDocument;
