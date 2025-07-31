import {
  getTextFormattedDate,
  getTruncatedText,
} from '@/app/utils/formatUtils';
import { Button, Card, Divider, Icon, Notification, Tooltip } from '@/ui';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
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
  const { remove, editComment, isLoading, isError } = handlers;

  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFullCommentaire, setIsFullCommentaire] = useState(false);
  const isEditing = editComment.isEditing;

  const { truncatedText: truncatedCom, isTextTruncated: isComTruncated } =
    getTruncatedText(commentaire, 160);

  useEffect(() => {
    if (isLoading) setIsEditLoading(true);
  }, [isLoading]);

  useEffect(() => {
    if (isError) setIsEditLoading(false);
  }, [isError]);

  useEffect(() => {
    setIsEditLoading(false);
  }, [commentaire, fichier?.filename, lien?.titre]);

  if (!fichier && !lien) return null;

  return (
    <>
      <div
        className={classNames('relative group max-w-screen-md', {
          'mt-3': fichier?.confidentiel,
        })}
        data-test="carte-doc"
      >
        {/** Cadenas document privé */}
        {fichier?.confidentiel && (
          <Tooltip label="Document en mode privé">
            <div className="absolute -top-5 left-5">
              <Notification icon="lock-fill" size="sm" classname="w-9 h-9" />
            </div>
          </Tooltip>
        )}
        {/* Menu de la carte document */}
        {!isReadonly && !isEditing && (
          <MenuCarteDocument
            document={document}
            className="absolute top-4 right-4 invisible group-hover:visible"
            onComment={() => editComment.enter()}
            onDelete={() => setIsDeleting(true)}
          />
        )}

        {/* Carte*/}
        <Card className="!p-4 h-full !gap-2">
          {/* Titre avec format et taille du fichier */}
          <span
            className="text-primary-8 hover:text-primary-8 transition text-base font-bold cursor-pointer"
            data-test="name"
            title={fichier ? 'Télécharger le fichier' : 'Ouvrir le lien'}
            onClick={() => openPreuve(document)}
          >
            {getFormattedTitle(document)}
          </span>

          {/** Identifiant de l'action liée (pour les docs "complémentaires") */}
          {displayIdentifier && action && (
            <span className="text-grey-6 leading-6 flex gap-2">
              {action.identifiant}
            </span>
          )}

          {/* Date de création et auteur */}
          <span className="text-grey-8 text-sm font-medium">
            {getAuthorAndDate(dateCreation, auteur)}
          </span>

          {/* Commentaire */}
          {!editComment.isEditing ? (
            !!commentaire &&
            commentaire.length > 0 && (
              <div className="mt-auto flex flex-col gap-2">
                <Divider color="light" className="-mb-6" />
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
                    {isFullCommentaire ? 'Voir moins' : 'Voir plus'}
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="mt-auto flex flex-col gap-2">
              <Divider color="light" className="-mb-6" />
              <DocumentInput
                editElement={editComment}
                type="textarea"
                className="text-grey-8 text-xs"
              />
            </div>
          )}

          {/* Date de visite */}
          {!!dateVisite && (
            <p className="text-xs text-grey-8 font-normal mb-1 pl-2">
              Visite effectuée le {getTextFormattedDate({ date: dateVisite })}
            </p>
          )}
        </Card>
      </div>

      {/* Alerte de suppression du document */}
      {isDeleting && !isReadonly && (
        <AlerteSuppression
          className="relative w-auto"
          isOpen={true}
          setIsOpen={setIsDeleting}
          title="Supprimer le document"
          message="Le document sera définitivement supprimé. Voulez-vous vraiment le supprimer ?"
          onDelete={() => {
            remove();
            setIsEditLoading(true);
          }}
        />
      )}
    </>
  );
};

export default CarteDocument;
