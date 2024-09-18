import {useEffect, useState} from 'react';
import classNames from 'classnames';
import {Button, Card, Divider, Icon} from '@tet/ui';
import {TPreuve} from 'ui/shared/preuves/Bibliotheque/types';
import {openPreuve} from 'ui/shared/preuves/Bibliotheque/openPreuve';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import MenuCarteDocument from './MenuCarteDocument';
import {getAuthorAndDate, getFormattedTitle} from './utils';
import {useEditPreuve} from 'ui/shared/preuves/Bibliotheque/useEditPreuve';
import AlerteSuppression from '../AlerteSuppression';
import DocumentInput from './DocumentInput';
import {getTruncatedText} from '../../utils';

type CarteDocumentProps = {
  isReadonly: boolean;
  document: TPreuve;
};

const CarteDocument = ({isReadonly, document}: CarteDocumentProps) => {
  const {
    commentaire,
    created_at: dateCreation,
    created_by_nom: auteur,
    fichier,
    lien,
  } = document;

  const handlers = useEditPreuve(document);
  const {remove, editComment, editFilename, isLoading, isError} = handlers;

  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFullCommentaire, setIsFullCommentaire] = useState(false);
  const isEditing = editComment.isEditing || editFilename.isEditing;

  const {truncatedText: truncatedCom, isTextTruncated: isComTruncated} =
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
      <div className="relative group h-full">
        {/* Menu de la carte document */}
        {!isReadonly && !isEditing && (
          <MenuCarteDocument
            document={document}
            className="invisible group-hover:visible absolute top-4 right-4 "
            onEdit={!!fichier ? () => editFilename.enter() : undefined}
            onComment={() => editComment.enter()}
            onDelete={() => setIsDeleting(true)}
          />
        )}

        {/* Carte*/}
        <Card className="!p-4 h-full">
          <div className="flex gap-4">
            {/* Icône document ou lien */}
            <div
              className={classNames(
                'shrink-0 rounded-md h-9 w-9 flex items-center justify-center',
                {
                  'bg-primary-1': isEditLoading,
                  'bg-primary-3': !isEditLoading,
                }
              )}
            >
              {isEditLoading ? (
                <SpinnerLoader className="mx-auto my-auto" />
              ) : (
                <Icon
                  icon={!!fichier ? 'file-2-line' : 'links-line'}
                  className="text-primary-10"
                />
              )}
            </div>

            {/* Contenu de la carte */}
            <div className="flex flex-col gap-2 w-full">
              {/* Titre avec format et taille du fichier */}
              {!editFilename.isEditing ? (
                <span
                  className="text-primary-10 hover:text-primary-8 transition text-base font-bold cursor-pointer"
                  title={
                    !!fichier ? 'Télécharger le fichier' : 'Ouvrir le lien'
                  }
                  onClick={() => openPreuve(document)}
                >
                  {getFormattedTitle(document)}
                </span>
              ) : (
                <DocumentInput
                  editElement={editFilename}
                  className="text-primary-10 text-base"
                />
              )}

              {/* Date de création et auteur */}
              <span className="text-grey-8 text-sm font-medium">
                {getAuthorAndDate(dateCreation, auteur)}
              </span>

              {/* Commentaire */}
              {!editComment.isEditing ? (
                !!commentaire &&
                commentaire.length > 0 && (
                  <>
                    <Divider className="-mb-5 w-full" />
                    <div className="flex gap-1">
                      <Icon
                        icon="discuss-line"
                        size="xs"
                        className="text-grey-7"
                      />
                      <span className="text-grey-8 text-xs font-medium italic whitespace-pre-wrap">
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
                          setIsFullCommentaire(prevState => !prevState)
                        }
                      >
                        {isFullCommentaire ? 'Voir moins' : 'Voir plus'}
                      </Button>
                    )}
                  </>
                )
              ) : (
                <>
                  <Divider className="-mb-5 w-full" />
                  <DocumentInput
                    editElement={editComment}
                    type="textarea"
                    className="text-grey-8 text-xs"
                  />
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Alerte de suppression du document */}
      <AlerteSuppression
        isOpen={isDeleting && !isReadonly}
        setIsOpen={setIsDeleting}
        title="Supprimer le document"
        message="Le document sera définitivement supprimé de la fiche. Voulez-vous vraiment le supprimer ?"
        onDelete={() => {
          remove();
          setIsEditLoading(true);
        }}
      />
    </>
  );
};

export default CarteDocument;
