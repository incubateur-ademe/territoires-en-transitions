import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';
import SideNav, {SideNavLinks} from 'ui/shared/SideNav';
import {IndicateurPersonnaliseCreationDialog} from './IndicateurPersonnaliseCreationDialog';
import {referentielToName} from 'app/labels';

/**
 * Affiche la navigation latérales vers les pages Indicateurs
 */
export const IndicateursNav = () => {
  const collectivite_id = useCollectiviteId();
  return collectivite_id ? (
    <div>
      <SideNav links={generateLinks(collectivite_id)} />
      <IndicateurPersonnaliseCreationDialog />
    </div>
  ) : null;
};

// correspondances entre item et libellé
export const VIEW_TITLES: Record<IndicateurViewParamOption, string> = {
  cles: 'Indicateurs clés',
  //  tous: 'Tous les indicateurs',
  perso: 'Indicateurs personnalisés',
  cae: `Indicateurs ${referentielToName.cae}`,
  eci: `Indicateurs ${referentielToName.eci}`,
  crte: 'Indicateurs Contrat de relance et de transition écologique (CRTE)',
};

// items dans l'ordre de l'affichage voulu
const ITEMS: IndicateurViewParamOption[] = [
  'cles',
  'perso',
  'cae',
  'eci',
  'crte',
];

// génère les liens à afficher dans la navigation latérale
const generateLinks = (collectiviteId: number): SideNavLinks => {
  return ITEMS.map(indicateurView => ({
    displayName: VIEW_TITLES[indicateurView],
    link: makeCollectiviteIndicateursUrl({collectiviteId, indicateurView}),
  }));
};
