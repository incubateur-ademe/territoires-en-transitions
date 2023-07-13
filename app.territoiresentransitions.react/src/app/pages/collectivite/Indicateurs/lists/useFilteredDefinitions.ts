import {ITEM_ALL} from 'ui/shared/filters/commons';
import {useIndicateurThematiquesLabels} from '../useIndicateurDefinitions';
import {
  TIndicateurDefinition,
  TIndicateurReferentielDefinition,
} from '../types';
import {useSearchParams} from 'core-logic/hooks/query';
import {useFilterOptions} from './useFilterOptions';
import {useEffect} from 'react';
import {TOption} from 'ui/shared/select/commons';

const ITEM_PARTICIPE_SCORE = 'ps';
const ITEM_SANS_THEMATIQUE = 'st';
const ITEM_TYPE_IMPACT = 'ti';
const ITEM_TYPE_RESULTAT = 'tr';

type TFilters = {
  selection?: string[];
};

// valeurs par défaut des filtres
const initialFilters: TFilters = {
  selection: [ITEM_ALL],
};

// mapping nom des filtres => params dans l'url
const nameToShortNames = {
  selection: 's',
};

type TFilteringParams = {
  /** liste de définitions à filtrer */
  definitions: TIndicateurDefinition[];
  /** libellé pour l'option par défaut ("tous") */
  defaultOptionLabel: string;
  /** pour ajouter le type d'indicateur (impact, résultat) aux options de filtrage */
  addTypeOptions?: boolean;
  /** pour ajouter la liste des thématiques aux options de filtrage */
  addThematiqueOptions?: boolean;
  /** ajoute le filtre "participe au score" avec le libellé donné si renseigné */
  addParticipationScoreWithLabel?: string;
};

export type TFilteredDefinitions = {
  /** options de filtrage valides */
  options: TOption[];
  /** options de filtrage sans résultat (grisées) */
  optionsWithoutResults: TOption[];
  /** sous-ensemble d'indicateurs après filtrage */
  definitions: TIndicateurDefinition[];
  /** options de filtrage sélectionnées (extraites de l'url) */
  selection: string[];
  /** ajoute ou supprime une option de filtrage de la sélection */
  updateSelection: (value: string) => void;
  /** réinitialise la sélection à la valeur par défaut */
  resetSelection: () => void;
};

/**
 * Gère le filtrage et les options de filtrage d'un ensemble de définitions d'indicateur
 */
export const useFilteredDefinitions = ({
  definitions,
  defaultOptionLabel,
  addTypeOptions,
  addThematiqueOptions,
  addParticipationScoreWithLabel,
}: TFilteringParams) => {
  // filtre initial
  const [filters, setFilters] = useSearchParams<TFilters>(
    '/',
    initialFilters,
    nameToShortNames
  );
  const {selection = []} = filters;

  // les id et le slibellés des thématiques
  const thematiques = useIndicateurThematiquesLabels();

  // gestionnaire d'options de filtrage
  const {addOption, insertOption, getOptionsWithCounters, applyFilters} =
    useFilterOptions({
      definitions,
      defaultOptionLabel,
    });

  // ajoute le sous-ensemble et l'option "participe au score" en 2ème position (index 1)
  if (addParticipationScoreWithLabel) {
    insertOption(
      1,
      {value: ITEM_PARTICIPE_SCORE, label: addParticipationScoreWithLabel},
      d => (d as TIndicateurReferentielDefinition).participation_score
    );
  }

  // ajoute un sous-ensemble et une option pour chaque type d'indicateurs
  if (addTypeOptions) {
    addOption(
      {value: ITEM_TYPE_IMPACT, label: 'Impact'},
      d => (d as TIndicateurReferentielDefinition).type === 'impact'
    );
    addOption(
      {value: ITEM_TYPE_RESULTAT, label: 'Résultat'},
      d => (d as TIndicateurReferentielDefinition).type === 'resultat'
    );
  }

  // ajoute un sous-ensemble et une option pour chaque thématique
  if (addThematiqueOptions) {
    thematiques.forEach(({id, label}) => {
      addOption({value: `t_${id}`, label}, d =>
        (d as TIndicateurReferentielDefinition).thematiques?.includes(id)
      );
    });

    // ajoute le sous-ensemble et l'option "sans thématique"
    addOption(
      {value: ITEM_SANS_THEMATIQUE, label: 'Sans thématique'},
      d => !(d as TIndicateurReferentielDefinition).thematiques?.length
    );
  }

  // met à jour la sélection de filtres avec la valeur donnée
  const updateSelection = (value: string): void =>
    setFilters({selection: addOrRemoveFilter(value, selection)});

  // réinitialise la sélection de filtres
  const resetSelection = () => setFilters(initialFilters);

  // réinitialise la sélection si une option sélectionnée n'est plus valide
  // c'est le cas notamment lorsque le filtre "à compléter" est sélectionné mais
  // que le dernier indicateur vient d'être complété après une saisie et que
  // l'utilisateur revient en arrière sur la liste
  const {options, optionsWithoutResults} = getOptionsWithCounters();
  const invalidOptions = optionsWithoutResults.map(o => o.value);
  const invalidSelection =
    selection.filter(value => invalidOptions.includes(value)).length > 0;
  useEffect(() => {
    if (invalidSelection) {
      resetSelection();
    }
  }, [invalidSelection]);

  return {
    options,
    optionsWithoutResults,
    definitions: applyFilters(selection),
    selection,
    updateSelection,
    resetSelection,
  };
};

/**
 * Ajoute ou supprime un filtre de la sélection suivant les règles :
 * - la valeur "tous" est exclusive
 * - une autre valeur est retirée si elle existe déjà ou ajoutée sinon
 * - la dernière valeur retirée est remplacée par "tous"
 */
const addOrRemoveFilter = (value: string, selection: string[]) => {
  if (value === ITEM_ALL) {
    return [ITEM_ALL];
  }

  const newSelection = selection.includes(ITEM_ALL) ? [] : selection;

  const index = newSelection.findIndex(v => v === value);
  if (index === -1) {
    newSelection.push(value);
  } else {
    newSelection.splice(index, 1);
  }

  return newSelection.length ? newSelection : [ITEM_ALL];
};
