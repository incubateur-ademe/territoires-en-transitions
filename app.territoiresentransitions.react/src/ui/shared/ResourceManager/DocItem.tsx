import {ChangeEvent, MouseEvent} from 'react';
import {TextInput} from '@dataesr/react-dsfr';
import {ButtonComment, ButtonRemove} from 'ui/shared/SmallIconButton';
import {openDoc} from './openDoc';
import {Doc, DocFile, DocLink, TEditHandlers} from './types';

/**
 * Affiche un document (nom de fichier ou titre lien) et gère l'édition de
 * commentaire, la suppression et l'ouverture ou le téléchargement
 */
export const DocItem = ({
  classComment,
  doc,
  handlers,
}: {
  classComment?: string;
  doc: Doc;
  handlers: TEditHandlers;
}) => {
  const {commentaire} = doc;
  const {filename} = doc as DocFile;
  const {titre} = doc as DocLink;

  const {
    remove,
    update,
    isEditingComment,
    setEditingComment,
    updatedComment,
    setUpdatedComment,
  } = handlers;

  return (
    <>
      <div className="flex justify-between group text-sm text-bf500 hover:bg-bf975 px-2 py-1 max-w-2xl mb-0 cursor-pointer">
        <div onClick={() => openDoc(doc)}>{filename || titre}</div>
        <div className="invisible group-hover:visible">
          <ButtonComment
            title="Commentaire"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setEditingComment(true);
            }}
          />
          <ButtonRemove
            title="Supprimer"
            className="fr-fi-delete-line"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              remove();
            }}
          />
        </div>
      </div>
      {!isEditingComment && commentaire ? (
        <p
          className={`text-sm text-gray-500 pl-2 pb-4 ${classComment || ''}`}
          onClick={(e: MouseEvent<HTMLParagraphElement>) => {
            e.preventDefault();
            setEditingComment(true);
          }}
        >
          {commentaire}
        </p>
      ) : null}
      {isEditingComment ? (
        <TextInput
          autoFocus
          placeholder="Écrire un commentaire..."
          className="mt-2"
          value={updatedComment}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setUpdatedComment(e.target.value)
          }
          onBlur={update}
          onKeyUp={(e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              update();
            }
          }}
        />
      ) : null}
    </>
  );
};
