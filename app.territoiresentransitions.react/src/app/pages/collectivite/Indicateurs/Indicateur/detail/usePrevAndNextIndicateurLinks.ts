import {useParams} from 'react-router-dom';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useFilteredIndicateurDefinitions} from '../../lists/useFilteredIndicateurDefinitions';

/**
 * Génération des liens "Indicateur précédent" et "Indicateur suivant"
 */
export const usePrevAndNextIndicateurLinks = () => {
  // paramètres de la page courante
  const collectiviteId = useCollectiviteId()!;
  const {
    vue,
    indicateurIdentiantReferentielParam: identifiantReferentiel,
    indicateurId,
  } = useParams<{
    vue: IndicateurViewParamOption;
    indicateurId: string;
    indicateurIdentiantReferentielParam: string;
  }>();

  // définitions
  const {data} = useFilteredIndicateurDefinitions({});

  let definitions = data;
  if (['cae', 'eci', 'crte'].includes(vue)) {
    definitions = definitions?.sort((a, b) =>
      // les liens doivent être dans l'ordre de la numérotation pour cae/eci/crte
      (a.identifiant as string).localeCompare(b.identifiant as string, 'fr', {
        ignorePunctuation: true,
        numeric: true,
      })
    );
  }

  if (!definitions?.length) return {};

  // index de l'indicateur courant
  const currentIndicateurIndex = definitions.findIndex(({identifiant, id}) =>
    identifiant
      ? identifiant === identifiantReferentiel
      : id.toString() === indicateurId
  );

  // indicateur précédent
  const prevIndicateur =
    currentIndicateurIndex > 0 && definitions[currentIndicateurIndex - 1];
  const prevIndicateurLink = prevIndicateur
    ? makeCollectiviteIndicateursUrl({
        collectiviteId,
        indicateurView: vue,
        indicateurId: prevIndicateur.id,
        identifiantReferentiel: prevIndicateur.identifiant,
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
        identifiantReferentiel: nextIndicateur.identifiant,
      })
    : undefined;

  return {prevIndicateurLink, nextIndicateurLink};
};
