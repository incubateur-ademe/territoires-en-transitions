import {ChangeEvent, useState} from 'react';
import classNames from 'classnames';
import {Tab, Tabs, useActiveTab} from 'ui/shared/Tabs';
import ThreeDotMenu from 'ui/shared/select/ThreeDotMenu';
import {InfoTooltip} from 'ui/shared/floating-ui/InfoTooltip';
import {
  onlyNumericRegExp,
  onlyNumericWithFloatRegExp,
  useInputFilterRef,
} from 'ui/shared/form/utils';
import {TIndicateurDefinition} from './types';
import {
  TIndicateurValeurEtCommentaires,
  useIndicateurValeursEtCommentaires,
} from './useIndicateurValeurs';
import {
  TEditIndicateurValeurHandlers,
  useEditIndicateurValeur,
} from './useEditIndicateurValeur';
import {useToggle} from 'ui/shared/useToggle';
import AnchorAsButton from 'ui/buttons/AnchorAsButton';
import Textarea from 'ui/shared/form/Textarea';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

/** Affiche les onglets résultats/objectifs */
export const IndicateurValuesTabs = ({
  definition,
}: {
  definition: TIndicateurDefinition;
}) => {
  const {activeTab, onChangeTab} = useActiveTab();
  const collectivite = useCurrentCollectivite();
  const isReadonly = !collectivite || collectivite.readonly;

  return (
    <Tabs defaultActiveTab={activeTab} onChange={onChangeTab}>
      <Tab label="Résultats" icon="checkbox">
        {activeTab === 0 && (
          <IndicateurValuesTable
            definition={definition}
            type="resultat"
            isReadonly={isReadonly}
          />
        )}
      </Tab>
      <Tab label="Objectifs" icon="calendar-2">
        {activeTab === 1 && (
          <IndicateurValuesTable
            definition={definition}
            type="objectif"
            isReadonly={isReadonly}
          />
        )}
      </Tab>
    </Tabs>
  );
};

/** Charge les données et affiche le tableau des valeurs */
const IndicateurValuesTable = ({
  definition,
  type,
  isReadonly,
}: {
  definition: TIndicateurDefinition;
  type: 'resultat' | 'objectif';
  isReadonly: boolean;
}) => {
  const {data: values} = useIndicateurValeursEtCommentaires({definition, type});
  const editHandlers = useEditIndicateurValeur({definition, type});

  return values ? (
    <ValuesTableBase
      type={type}
      values={values}
      isReadonly={isReadonly}
      definition={definition}
      editHandlers={editHandlers}
    />
  ) : null;
};

const SHOW_MORE_THRESHOLD = 2;
/** Affiche le tableau des valeurs associées à un indicateur */
const ValuesTableBase = ({
  type,
  values,
  definition,
  isReadonly,
  editHandlers,
}: {
  type: 'resultat' | 'objectif';
  definition: TIndicateurDefinition;
  values: TIndicateurValeurEtCommentaires[];
  isReadonly: boolean;
  editHandlers: TEditIndicateurValeurHandlers;
}) => {
  const {unite} = definition;
  const [showAll, toggleShowAll] = useToggle(false);
  const haveManyValues = values.length > SHOW_MORE_THRESHOLD;
  const valuesToShow =
    haveManyValues && !showAll ? values.slice(0, SHOW_MORE_THRESHOLD) : values;

  return (
    <table className="w-full fr-table fr-table--bordered fr-mb-0">
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">
            {type === 'resultat' ? 'Résultat' : 'Objectif'}
            {unite && <span className="font-normal"> ({unite})</span>}
          </th>
          <th scope="col">Commentaires</th>
        </tr>
      </thead>
      <tbody>
        {isReadonly ? (
          valuesToShow.map(row => (
            <ValueTableRowReadOnly key={`${row.type}-${row.annee}`} row={row} />
          ))
        ) : (
          <>
            <ValueTableRow key="new" editHandlers={editHandlers} />
            {valuesToShow.map(row => (
              <ValueTableRow
                key={`${row.type}-${row.annee}`}
                row={row}
                editHandlers={editHandlers}
              />
            ))}
          </>
        )}
        {haveManyValues && (
          <tr>
            <td colSpan={3}>
              <AnchorAsButton
                className={classNames(
                  'fr-link--icon-right text-bf500',
                  showAll
                    ? 'fr-icon-arrow-up-s-line'
                    : 'fr-icon-arrow-down-s-line'
                )}
                onClick={toggleShowAll}
              >
                {showAll
                  ? 'Afficher uniquement les résultats récents'
                  : 'Afficher tous les résultats'}
              </AnchorAsButton>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const PLACEHOLDER = 'Écrire ici...';
const OPTION_DELETE = 'delete';
const OPTIONS = [
  {
    value: OPTION_DELETE,
    label: 'Supprimer cette ligne',
    icon: 'fr-icon-delete-line',
  },
];

const useTableRowState = ({
  row,
  editHandlers,
}: {
  row?: TIndicateurValeurEtCommentaires;
  editHandlers: TEditIndicateurValeurHandlers;
}) => {
  const {editValeur, editComment, deleteValue} = editHandlers;

  const initialState = {
    annee: row?.annee?.toString() || '',
    valeur: row?.valeur?.toString() || '',
    commentaire: row?.commentaire || '',
  };
  const [state, setState] = useState(initialState);

  const isImport = row && row.type === 'import';

  const isReadonly = {
    /** l'année est en lecture seule si elle déjà enregistrée */
    annee: row !== undefined,
    /** la valeur est en lecture seule si l'année n'est pas renseignée */
    valeur: !state.annee,
    /** le commentaire est en lecture seule si la valeur ou l'année ne sont pas renseignées */
    commentaire: !state.annee || !state.valeur,
  };

  const onChange = (
    key: keyof typeof state,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setState({...state, [key]: e.target.value});

  const onBlur = () => {
    // il faut une date valide pour sauvegarder
    const annee = parseInt(state.annee || '');
    if (isNaN(annee)) {
      return;
    }

    const valeur = parseFloat(state.valeur.replace(',', '.') || '');
    // si la valeur n'est pas valide restaure l'état précédent
    if (isNaN(valeur)) {
      setState(initialState);
    }
    // sinon et si la valeur a changé
    else if (valeur !== row?.valeur) {
      // réinitialise l'état si on vient d'ajouter une nouvelle ligne, sinon le
      // refetch après enregistrement provoquera l'affichage de 2 lignes dans le tableau
      if (!row?.annee) {
        setState({annee: '', valeur: '', commentaire: ''});
      }
      // enregistre la valeur si elle est valide
      editValeur({annee, valeur});
    }

    // vérifie si le commentaire a changé
    const {commentaire} = state;
    if (row && row.commentaire !== commentaire) {
      editComment({annee, commentaire});
    }
  };

  const onSelectMenuOption = (value: string) => {
    if (value === OPTION_DELETE) {
      const annee = parseInt(state.annee || '');
      if (isNaN(annee)) {
        return;
      }
      deleteValue({annee});
    }
  };

  return {
    ...state,
    isImport,
    isReadonly,
    onChange,
    onBlur,
    onSelectMenuOption,
  };
};

/** Affiche une ligne du tableau */
const ValueTableRow = ({
  row,
  editHandlers,
}: {
  row?: TIndicateurValeurEtCommentaires;
  editHandlers: TEditIndicateurValeurHandlers;
}) => {
  const {
    annee,
    valeur,
    commentaire,
    isImport,
    isReadonly,
    onChange,
    onBlur,
    onSelectMenuOption,
  } = useTableRowState({row, editHandlers});

  // ref. pour appliquer un filtre dans les champs de saisie
  const refAnnee = useInputFilterRef<HTMLInputElement>(
    onlyNumericRegExp,
    'Nombre uniquement'
  );
  const refValeur = useInputFilterRef<HTMLInputElement>(
    onlyNumericWithFloatRegExp,
    'Nombre uniquement'
  );

  const showDeleteButton = Boolean(row && !isImport);

  return (
    <tr>
      <td>
        <input
          className={classNames({'font-bold': !!annee})}
          type="text"
          ref={refAnnee}
          placeholder={PLACEHOLDER}
          value={annee}
          readOnly={isReadonly.annee}
          size={4}
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
      <td className={classNames({'!flex !justify-between': showDeleteButton})}>
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
const ValueTableRowReadOnly = ({
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
          {valeur}
        )}
      </td>
      <td>
        {isImport
          ? row?.source && (
              <span className="text-grey625">Source : {source}</span>
            )
          : {commentaire}}
      </td>
    </tr>
  );
};
