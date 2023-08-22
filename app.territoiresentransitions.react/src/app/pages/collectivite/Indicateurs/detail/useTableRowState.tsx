import {ChangeEvent, useEffect, useState} from 'react';
import {TIndicateurValeurEtCommentaires} from '../useIndicateurValeurs';
import {TEditIndicateurValeurHandlers} from './useEditIndicateurValeur';

export const OPTION_DELETE = 'delete';

export type TUseTableRowStateArgs = {
  /** donnée de la ligne (`undefined` pour une nouvelle ligne) */
  row?: TIndicateurValeurEtCommentaires;
  /** fonctions pour mettre à jour les données ou supprimer la ligne */
  editHandlers: TEditIndicateurValeurHandlers;
  /** valeurs courantes pour pouvoir vérifier si une nouvelle ligne va écraser
   * une valeur existante */
  values?: TIndicateurValeurEtCommentaires[];
  /** appelé quand la valeur d'une nouvelle ligne est enregisrée */
  onValueSaved?: (annee: number) => void;
};

const getInitialState = (row?: TIndicateurValeurEtCommentaires) => ({
  annee: row?.annee?.toString() || '',
  valeur: row?.valeur?.toString() || '',
  commentaire: row?.commentaire || '',
  confirmAvantEcrasement: null,
});
type TState = Omit<
  ReturnType<typeof getInitialState>,
  'confirmAvantEcrasement'
> & {
  confirmAvantEcrasement: null | TIndicateurValeurEtCommentaires;
};

export const useTableRowState = ({
  row,
  values,
  editHandlers,
  onValueSaved,
}: TUseTableRowStateArgs) => {
  const {editValeur, editComment, deleteValue} = editHandlers;

  const initialState = getInitialState(row);
  const [state, setState] = useState<TState>(initialState);

  // remet à jour l'état interne si l'état initial a changé
  const initialStateSerialized = JSON.stringify(initialState);
  useEffect(() => {
    setState(initialState);
  }, [initialStateSerialized]);

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
  ) => {
    if (key === 'annee' && e.target.value.length > 4) {
      setState({...state, annee: e.target.value.slice(0, 4)});
    } else {
      setState({...state, [key]: e.target.value});
    }
  };

  const onBlur = () => {
    saveChange(false);
  };

  const saveChange = (dismissConfirm: boolean) => {
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

    // sinon enregistre la valeur si elle a changé
    else if (valeur !== row?.valeur) {
      const isNewRow = !row?.annee;

      // mais pour une nouvelle ligne on vérifie d'abord si l'année est déjà
      // présente dans les valeurs existantes
      if (isNewRow && !dismissConfirm) {
        const existingRow = values?.find(v => v.annee === annee);
        if (existingRow && existingRow.valeur !== valeur) {
          setState({...state, confirmAvantEcrasement: existingRow});
          return;
        }
      }

      editValeur({annee, valeur});
      // réinitialise l'état si on vient d'ajouter une nouvelle ligne, sinon le
      // refetch après enregistrement provoquera l'affichage de 2 lignes dans le tableau
      if (isNewRow) {
        onValueSaved?.(annee);
        setState(getInitialState(undefined));
      }
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

  const onDismissConfirm = (confirm: boolean) => {
    if (confirm) {
      saveChange(true);
    } else {
      setState({...state, confirmAvantEcrasement: null});
    }
  };

  return {
    ...state,
    isImport,
    isReadonly,
    onChange,
    onBlur,
    onSelectMenuOption,
    onDismissConfirm,
  };
};
