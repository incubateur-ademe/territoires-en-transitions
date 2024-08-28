import {Alert, Tab, Tabs} from '@tet/ui';
import {getIndicateurTrajectoire} from '../constants';
import {TableauDonnees} from './TableauDonnees';
import {useDonneesSectorisees} from './useDonneesSectorisees';

export type DonneesCollectiviteProps = {};

const TABS = [
  {
    id: 'emissions_ges',
    label: 'Données GES 2015 (ktCO2)',
    description:
      "Pour assurer la cohérence des calculs, n'entrer ici que les valeurs au format PCAET. Pour ces données, nous recommandons d’utiliser les données issues de votre observatoire. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant. Si disponibles, privilégiez les données RARE-OREC et utilisez les données CITEPA uniquement en complément.",
  },
  {
    id: 'sequestration_carbone',
    label: 'Séquestration carbone 2015 (ktCO2)',
    description:
      'Attention : en cas de séquestration, entrez des valeurs négatives. Pour ces données, nous recommandons d’utiliser les données issues d’ALDO. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant.',
  },
  {
    id: 'consommations_finales',
    label: 'Consommation d’énergie 2015 (GWh)',
    description:
      'Pour ces données, nous recommandons d’utiliser les données issues de votre observatoire. Pour vous faciliter ce travail, les données disponibles en open data sont affichées dans le tableau suivant.',
  },
] as const;

type TabInfo = (typeof TABS)[number];

/**
 * Affiche le contenu de la modale permettant de saisir les données de la
 * collectivité et de lancer un nouveau calcul
 */
export const DonneesCollectivite = (props: DonneesCollectiviteProps) => {
  //  const {valeurs} = props;
  // TODO

  return (
    <div className="text-center">
      <h3>Lancer un nouveau calcul</h3>
      <p>
        Vous pouvez lancer un calcul de la trajectoire SNBC territorialisée en
        complétant les données ci-après. Les données à entrer sont les résultats
        observés pour l’année 2015 : c’est l’année de référence de la SNBC v2.
      </p>
      <Tabs defaultActiveTab={1} onChange={() => {}}>
        {TABS.map(tab => (
          <OngletDonnees key={tab.id} tab={tab} />
        ))}
      </Tabs>
    </div>
  );
};

const OngletDonnees = ({tab}: {tab: TabInfo}) => {
  const indicateur = getIndicateurTrajectoire(tab.id);
  const {data} = useDonneesSectorisees(indicateur);
  const {sources, valeursSecteurs} = data || {};

  return (
    <Tab label={tab.label} {...getTabProps(true)}>
      <Alert className="text-left" state="info" description={tab.description} />
      {sources && valeursSecteurs && (
        <TableauDonnees
          indicateur={indicateur}
          valeursSecteurs={valeursSecteurs}
          sources={sources}
          onChange={args => console.log('TODO: save changes', args)}
        />
      )}
    </Tab>
  );
};

// Donne les props (picto, couleur, infobulle) appropriées à un onglet suivant
// que les données sont complètes ou non
const getTabProps = (donneesCompletes: boolean) => {
  return donneesCompletes
    ? ({
        icon: 'checkbox-circle-fill',
        iconClassName: 'text-success-3',
        iconPosition: 'right',
      } as const)
    : ({
        icon: 'alert-fill',
        iconClassName: 'text-warning-1',
        iconPosition: 'right',
        title:
          'Formulaire incomplet : veuillez le compléter pour valider et lancer le calcul',
      } as const);
};
