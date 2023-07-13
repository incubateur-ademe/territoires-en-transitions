import {Link} from 'react-router-dom';
import {
  IndicateurViewParamOption,
  makeCollectiviteIndicateursUrl,
} from 'app/paths';
import {referentielToName} from 'app/labels';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import SideNav, {SideNavLinks} from 'ui/shared/SideNav';

/**
 * Affiche la navigation latérales vers les pages Indicateurs
 */
export const IndicateursNav = () => {
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id;
  return collectiviteId ? (
    <div>
      <SideNav links={generateLinks(collectiviteId)} />
      {!collectivite.readonly && (
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
      )}
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
