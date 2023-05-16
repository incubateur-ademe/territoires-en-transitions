import {ChangeEvent, KeyboardEvent, MouseEvent} from 'react';
import classNames from 'classnames';
import {format} from 'date-fns';
import {fr} from 'date-fns/locale';
import {ButtonComment, ButtonEdit} from 'ui/buttons/SmallIconButton';
import {formatFileSize, getExtension} from 'utils/file';
import {TPreuve, TEditHandlers} from './types';
import {openPreuve} from './openPreuve';
import {useEditPreuve} from './useEditPreuve';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import {TEditState} from 'core-logic/hooks/useEditState';
import {ConfirmSupprPreuveBtn} from './ConfirmSupprPreuveBtn';
import {IdentifiantAction} from './IdentifiantAction';
import AnchorAsButton from 'ui/buttons/AnchorAsButton';

export type TPreuveDocProps = {
  classComment?: string;
  preuve: TPreuve;
  readonly?: boolean;
  handlers: TEditHandlers;
  displayIdentifier?: boolean;
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
  displayIdentifier,
}: TPreuveDocProps) => {
  const {action, commentaire, fichier, rapport} = preuve;
  const dateVisite = rapport?.date;

  const {remove, editComment, editFilename} = handlers;
  const isEditing = editComment.isEditing || editFilename.isEditing;

  return (
    <div data-test="item">
      <div className="flex justify-between group text-sm text-bf500 hover:bg-bf975 px-2 py-1 max-w-2xl mb-0 cursor-pointer">
        {/* Lien du document */}
        <div className="flex gap-2">
          <PreuveTitle preuve={preuve} />
          {displayIdentifier && action && <IdentifiantAction action={action} />}
        </div>

        {/* Menu d'édition du document */}
        {!readonly && !isEditing && (
          <div className="invisible group-hover:visible">
            {fichier && (
              <ButtonEdit
                title="Renommer"
                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  editFilename.enter();
                }}
              />
            )}
            <ButtonComment
              title="Décrire"
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                editComment.enter();
              }}
            />
            <ConfirmSupprPreuveBtn removePreuve={remove} />
          </div>
        )}
      </div>

      {/* Commentaire ajouté par l'utilisateur */}
      {commentaire && !readonly && !isEditing && (
        <p
          data-test="comment"
          className={classNames('text-xs fr-text-mention--grey mb-1 pl-2', {
            classComment,
          })}
          onClick={(e: MouseEvent<HTMLParagraphElement>) => {
            e.preventDefault();
            editComment.enter();
          }}
        >
          {commentaire}
        </p>
      )}

      {/* Edition du commentaire / nom du fichier */}
      <TextInputWithEditState
        editState={editComment}
        placeholder="Écrire un commentaire..."
      />
      <TextInputWithEditState
        editState={editFilename}
        placeholder="Renommer le fichier..."
      />

      {/* Date de visite */}
      {!!dateVisite && (
        <p className="text-xs fr-text-mention--grey mb-1 pl-2">
          Visite effectuée le {formatDate(dateVisite)}
        </p>
      )}

      {/* Date de création */}
      {formatCreatedAt(preuve)}
    </div>
  );
};

/**
 * Détermine le picto en fonction du type (fichier ou lien)
 */
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

/**
 * Affiche le titre d'une preuve sous forme de lien
 */
const PreuveTitle = ({preuve}: {preuve: TPreuve}) => {
  const picto = preuvePicto(preuve);

  return (
    <AnchorAsButton
      data-test="name"
      className={classNames('fr-text--sm fr-mb-1v', picto, {
        'fr-link--icon-left': Boolean(picto),
      })}
      onClick={() => openPreuve(preuve)}
    >
      {formatTitle(preuve)}
    </AnchorAsButton>
  );
};

/**
 * Affiche un champ d'édition associé à un gestionnaire d'édition
 */
const TextInputWithEditState = ({
  editState,
  placeholder,
}: {
  editState: TEditState;
  placeholder: string;
}) => {
  return editState.isEditing ? (
    <input
      autoFocus
      className="fr-input fr-my-2v"
      placeholder={placeholder}
      value={editState.value}
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        editState.setValue(e.target.value)
      }
      onBlur={editState.exit}
      onKeyUp={(e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          editState.exit();
        }
      }}
    />
  ) : null;
};

/**
 * Formate le titre en fonction du type (fichier ou lien)
 */
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

/**
 * Formate la date de création et le nom de l'utilisateur associé
 */
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
    <p className="text-xs fr-text-mention--grey mb-1 pl-2">
      {modif} le {le} par {author}
    </p>
  );
};

const formatDate = (date: string) =>
  format(new Date(date), 'dd MMM yyyy', {locale: fr});
