import {useParams} from 'react-router-dom';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  useIndicateursParentsCles,
  useIndicateursParentsGroup,
  useIndicateursParentsSelection,
} from '../useIndicateurDefinitions';
import {useIndicateursPersoDefinitions} from '../useIndicateursPersoDefinitions';
import {TIndicateurDefinition} from '../types';

/**
 * Génération des liens "Indicateur précédent" et "Indicateur suivant"
 */
export const usePrevAndNextIndicateurLinks = () => {
  // paramètres de la page courante
  const collectiviteId = useCollectiviteId()!;
  const {vue, indicateurId} = useParams<{
    vue: IndicateurViewParamOption;
    indicateurId: string;
  }>();

  // définitions
  const groups = useIndicateursParentsGroup(vue);
  const cles = useIndicateursParentsCles();
  const selection = useIndicateursParentsSelection();
  const persos = useIndicateursPersoDefinitions(collectiviteId);
  let definitions: TIndicateurDefinition[] | undefined = [];
  if (['cae', 'eci', 'crte'].includes(vue)) {
    definitions = groups?.sort((a, b) =>
      // les liens doivent être dans l'ordre de la numérotation pour cae/eci/crte
      a.id.localeCompare(b.id, 'fr', {ignorePunctuation: true, numeric: true})
    );
  } else if (vue === 'cles') {
    definitions = cles;
  } else if (vue === 'selection') {
    definitions = selection;
  } else if (vue === 'perso') {
    definitions = persos;
  }

  if (!definitions?.length) return {};

  // index de l'indicateur courante
  const currentIndicateurIndex = definitions.findIndex(
    ({id}) => id.toString() === indicateurId
  );

  // indicateur précédent
  const prevIndicateur =
    currentIndicateurIndex > 0 && definitions[currentIndicateurIndex - 1];
  const prevIndicateurLink = prevIndicateur
    ? makeCollectiviteIndicateursUrl({
        collectiviteId,
        indicateurView: vue,
        indicateurId: prevIndicateur.id,
      })
    : undefined;

  // indicateur suivant
  const nextIndicateur =
    currentIndicateurIndex < definitions.length - 1 &&
    definitions[currentIndicateurIndex + 1];
  const nextIndicateurLink = nextIndicateur
    ? makeCollectiviteIndicateursUrl({
        collectiviteId,
        indicateurView: vue,
        indicateurId: nextIndicateur.id,
      })
    : undefined;

  return {prevIndicateurLink, nextIndicateurLink};
};
