import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import {Link} from 'react-router-dom';
import {useCollectiviteId} from 'core-logic/hooks/params';
import SideNav, {SideNavLinks} from 'ui/shared/SideNav';
import {referentielToName} from 'app/labels';

/**
 * Affiche la navigation latérales vers les pages Indicateurs
 */
export const IndicateursNav = () => {
  const collectiviteId = useCollectiviteId();
  return collectiviteId ? (
    <div>
      <SideNav links={generateLinks(collectiviteId)} />
      <Link
        className="fr-btn fr-btn--tertiary fr-ml-4w"
        to={makeCollectiviteIndicateursUrl({
          collectiviteId,
          indicateurView: 'perso',
          indicateurId: 'nouveau',
        })}
      >
        Créer un indicateur
      </Link>
    </div>
  ) : null;
};

// correspondances entre item et libellé
export const VIEW_TITLES: Record<IndicateurViewParamOption, string> = {
  selection: 'Sélection',
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
  'selection',
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
