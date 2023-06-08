import {referentielToName} from 'app/labels';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import SideNav, {SideNavLinks} from 'ui/shared/SideNav';

/**
 * Affiche les liens vers les pages Indicateurs
 */
export const IndicateursNav = () => {
  const collectivite_id = useCollectiviteId();
  return collectivite_id ? (
    <SideNav links={generateLinks(collectivite_id)} />
  ) : null;
};

// correspondances entre item et libellé
const LABELS: Record<IndicateurViewParamOption, string> = {
  perso: 'Indicateurs personnalisés',
  ...referentielToName,
};

// items dans l'ordre de l'affichage voulu
const ITEMS: IndicateurViewParamOption[] = ['perso', 'cae', 'eci', 'crte'];

// génère les liens à afficher dans la navigation latérale
const generateLinks = (collectiviteId: number): SideNavLinks => {
  return ITEMS.map(indicateurView => ({
    displayName: LABELS[indicateurView],
    link: makeCollectiviteIndicateursUrl({collectiviteId, indicateurView}),
  }));
};
