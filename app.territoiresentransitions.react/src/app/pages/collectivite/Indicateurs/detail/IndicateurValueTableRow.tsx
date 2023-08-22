import classNames from 'classnames';
import ThreeDotMenu from 'ui/shared/select/ThreeDotMenu';
import {InfoTooltip} from 'ui/shared/floating-ui/InfoTooltip';
import Modal from 'ui/shared/floating-ui/Modal';
import Textarea from 'ui/shared/form/Textarea';
import {
  onlyNumericRegExp,
  onlyNumericWithFloatRegExp,
  useInputFilterRef,
} from 'ui/shared/form/utils';
import {TIndicateurValeurEtCommentaires} from '../useIndicateurValeurs';
import {
  OPTION_DELETE,
  TUseTableRowStateArgs,
  useTableRowState,
} from './useTableRowState';

const PLACEHOLDER = 'Écrire ici...';
const OPTIONS = [
  {
    value: OPTION_DELETE,
    label: 'Supprimer cette ligne',
    icon: 'fr-icon-delete-line',
  },
];

/** Affiche une ligne du tableau */
export const IndicateurValueTableRow = ({
  row,
  autoFocus,
  values,
  editHandlers,
  onValueSaved,
}: TUseTableRowStateArgs & {
  /** pour garder le focus dans le champ commentaire après l'ajout et le refetch
   * d'une nouvelle ligne */
  autoFocus?: boolean;
  /** valeurs courantes pour pouvoir vérifier si une nouvelle ligne va écraser
   * une valeur existante */
  values?: TIndicateurValeurEtCommentaires[];
}) => {
  const state = useTableRowState({row, editHandlers, onValueSaved, values});
  const {
    annee,
    valeur,
    commentaire,
    confirmAvantEcrasement,
    isImport,
    isReadonly,
    onChange,
    onBlur,
    onSelectMenuOption,
  } = state;

  // ref. pour appliquer un filtre dans les champs de saisie
  const refAnnee = useInputFilterRef<HTMLInputElement>(
    onlyNumericRegExp,
    'Écrire ici au format AAAA'
  );
  const refValeur = useInputFilterRef<HTMLInputElement>(
    onlyNumericWithFloatRegExp,
    'Nombre uniquement'
  );

  const showDeleteButton = Boolean(row && !isImport);

  return (
    <>
      <tr>
        <td>
          <input
            className={classNames({'font-bold': !!annee})}
            type="text"
            ref={refAnnee}
            placeholder={PLACEHOLDER}
            value={annee}
            readOnly={isReadonly.annee}
            size={8}
            onChange={e => onChange('annee', e)}
          />
        </td>
        <td>
          {isImport ? (
            <ValueImported valeur={valeur} />
          ) : (
            <input
              type="text"
              ref={refValeur}
              placeholder={isReadonly.valeur ? undefined : PLACEHOLDER}
              value={valeur}
              readOnly={isReadonly.valeur}
              size={12}
              onChange={e => onChange('valeur', e)}
              onBlur={onBlur}
            />
          )}
        </td>
        <td
          className={classNames({'!flex !justify-between': showDeleteButton})}
        >
          {isImport ? (
            row?.source && (
              <span className="text-grey625">Source : {row?.source}</span>
            )
          ) : (
            <Textarea
              className="!outline-none !pl-0 !py-0"
              placeholder={isReadonly.commentaire ? undefined : PLACEHOLDER}
              value={commentaire || undefined}
              readOnly={isReadonly.commentaire}
              onChange={e => onChange('commentaire', e)}
              onBlur={onBlur}
              autoFocus={autoFocus}
            />
          )}
          {showDeleteButton && (
            <ThreeDotMenu
              buttonClassname="bg-white"
              options={OPTIONS}
              onSelect={onSelectMenuOption}
            />
          )}
        </td>
      </tr>
      {confirmAvantEcrasement !== null && <ConfirmModif state={state} />}
    </>
  );
};

/** Affiche une valeur importée */
const ValueImported = ({valeur}: {valeur: string}) => (
  <>
    <span className="text-grey625 font-bold w-fit">{valeur}</span>
    <InfoTooltip
      label={() => (
        <span>
          Cette valeur est renseignée <b>automatiquement</b>. Pour toute
          question, l’équipe est à votre écoute sur
          contact@territoiresentransitions.fr !
        </span>
      )}
    />
  </>
);

/** Affiche une ligne du tableau en lecture seule */
export const ValueTableRowReadOnly = ({
  row,
}: {
  row?: TIndicateurValeurEtCommentaires;
}) => {
  if (!row) return null;
  const {annee, valeur, commentaire, source, type} = row;

  const isImport = type === 'import';
  return (
    <tr>
      <td className="font-bold">{annee}</td>
      <td>
        {isImport ? (
          <ValueImported valeur={valeur?.toLocaleString('fr')} />
        ) : (
          valeur
        )}
      </td>
      <td>
        {isImport
          ? row?.source && (
              <span className="text-grey625">Source : {source}</span>
            )
          : commentaire}
      </td>
    </tr>
  );
};

/** Affiche un dialogue de confirmation */

const ConfirmModif = ({
  state,
}: {
  state: ReturnType<typeof useTableRowState>;
}) => {
  const {annee, confirmAvantEcrasement, onDismissConfirm, valeur} = state;
  if (!confirmAvantEcrasement) return null;

  return (
    <Modal
      disableDismiss
      noCloseButton
      externalOpen={true}
      render={() => (
        <div className="fr-py-2w">
          <h4>Confirmer la modification</h4>
          <p>Attention, une valeur existe déjà pour l'année {annee}.</p>
          <p>
            Voulez-vous écraser l'ancienne valeur (
            {confirmAvantEcrasement.valeur}) par la nouvelle valeur saisie (
            {valeur}) ?
          </p>
          <div className="flex flex-end">
            <button
              className="fr-btn fr-btn--sm fr-mr-2w"
              onClick={() => {
                onDismissConfirm(true);
              }}
            >
              Confirmer
            </button>
            <button
              className="fr-btn fr-btn--sm fr-btn--secondary"
              onClick={() => {
                onDismissConfirm(false);
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    />
  );
};
