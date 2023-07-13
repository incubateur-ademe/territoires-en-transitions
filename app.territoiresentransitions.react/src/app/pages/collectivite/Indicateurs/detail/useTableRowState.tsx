import {ChangeEvent, useState} from 'react';
import {TIndicateurValeurEtCommentaires} from '../useIndicateurValeurs';
import {TEditIndicateurValeurHandlers} from './useEditIndicateurValeur';

export const OPTION_DELETE = 'delete';

export const useTableRowState = ({
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
  ) => {
    if (key === 'annee' && e.target.value.length > 4) {
      setState({...state, annee: e.target.value.slice(0, 4)});
    } else {
      setState({...state, [key]: e.target.value});
    }
  };

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
