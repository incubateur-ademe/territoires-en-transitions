import {ChangeEvent, MouseEvent} from 'react';
import {TextInput} from '@dataesr/react-dsfr';
import classNames from 'classnames';
import {format} from 'date-fns';
import {fr} from 'date-fns/locale';
import {ButtonComment, ButtonRemove} from 'ui/shared/SmallIconButton';
import {formatFileSize, getExtension} from 'utils/file';
import {TPreuve, TEditHandlers} from './types';
import {openPreuve} from './openPreuve';
import {useEditPreuve} from './useEditPreuve';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

export type TPreuveDocProps = {
  classComment?: string;
  preuve: TPreuve;
  readonly?: boolean;
  handlers: TEditHandlers;
};

const PreuveDocConnected = (props: Omit<TPreuveDocProps, 'handlers'>) => {
  const handlers = useEditPreuve(props.preuve);
  const currentCollectivite = useCurrentCollectivite();
  return (
    <PreuveDoc
      {...props}
      readonly={
        !currentCollectivite || currentCollectivite.readonly || props.readonly
      }
      handlers={handlers}
    />
  );
};

export default PreuveDocConnected;

/**
 * Affiche un document (nom de fichier ou titre lien) et gère l'édition de
 * commentaire, la suppression et l'ouverture ou le téléchargement
 */
export const PreuveDoc = ({
  classComment,
  preuve,
  readonly,
  handlers,
}: TPreuveDocProps) => {
  const {commentaire} = preuve;
  const dateVisite = preuve.rapport?.date;

  const {
    remove,
    update,
    isEditingComment,
    setEditingComment,
    updatedComment,
    setUpdatedComment,
  } = handlers;

  const picto = preuvePicto(preuve);

  return (
    <div data-test="item">
      <div className="flex justify-between group text-sm text-bf500 hover:bg-bf975 px-2 py-1 max-w-2xl mb-0 cursor-pointer">
        <a
          data-test="name"
          href="#"
          className={classNames('fr-text--sm fr-mb-1v', picto, {
            'fr-link--icon-left': Boolean(picto),
          })}
          onClick={() => openPreuve(preuve)}
        >
          {formatTitle(preuve)}
        </a>
        {!readonly ? (
          <div className="invisible group-hover:visible">
            <ButtonComment
              title="Décrire"
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
        ) : null}
      </div>
      {!isEditingComment && commentaire && !readonly ? (
        <p
          data-test="comment"
          className={`text-xs fr-text-mention--grey mb-0 ${classComment || ''}`}
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
          className="fr-my-2v"
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
      {dateVisite ? (
        <p className="text-xs grey625 mb-0">
          Visite effectuée le {formatDate(dateVisite)}
        </p>
      ) : null}
      {formatCreatedAt(preuve)}
    </div>
  );
};

// détermine le picto en fonction du type (fichier ou lien)
const preuvePicto = (preuve: TPreuve) => {
  const {fichier, lien} = preuve;
  if (fichier) {
    return 'fr-fi-file-line';
  }
  if (lien) {
    return 'fr-fi-links-fill';
  }
  return null;
};

// formate le titre en fonction du type (fichier ou lien)
const formatTitle = (preuve: TPreuve) => {
  const {fichier, lien} = preuve;
  if (fichier) {
    const {filename, filesize} = fichier;
    return `${filename} (${getExtension(
      filename
    )?.toUpperCase()}, ${formatFileSize(filesize)})`;
  }
  if (lien) {
    const {titre} = lien;
    return titre;
  }
  return null;
};

// formate la date de création et le nom de l'utilisateur associé
const formatCreatedAt = (preuve: TPreuve) => {
  const {created_at, created_by_nom} = preuve;
  return created_at && created_by_nom
    ? formatDateAndAuthor(created_at, created_by_nom, false)
    : null;
};

const formatDateAndAuthor = (
  date: string,
  author: string,
  isModification: boolean
) => {
  const le = formatDate(date);
  const modif = isModification ? 'Modifié' : 'Ajouté';
  return (
    <span className="text-xs grey625">
      {modif} le {le} par {author}
    </span>
  );
};

const formatDate = (date: string) =>
  format(new Date(date), 'dd MMM yyyy', {locale: fr});
