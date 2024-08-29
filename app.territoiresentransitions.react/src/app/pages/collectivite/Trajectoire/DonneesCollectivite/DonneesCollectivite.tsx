import {Alert, Button, ModalFooter, RenderProps, Tab, Tabs} from '@tet/ui';
import {TableauDonnees} from './TableauDonnees';
import {useDonneesSectorisees} from './useDonneesSectorisees';
import {useUpsertValeurIndicateur} from './useUpsertValeurIndicateur';
import {TABS} from './constants';
import {DATE_DEBUT} from 'app/pages/collectivite/Trajectoire/constants';
import {useCalculTrajectoire} from 'app/pages/collectivite/Trajectoire/useCalculTrajectoire';
import SpinnerLoader from 'ui/shared/SpinnerLoader';

export type DonneesCollectiviteProps = {
  modalProps: RenderProps;
};

/**
 * Affiche le contenu de la modale permettant de saisir les données de la
 * collectivité et de lancer un nouveau calcul
 */
export const DonneesCollectivite = ({modalProps}: DonneesCollectiviteProps) => {
  const {donneesCompletes, donneesSectorisees} = useDonneesSectorisees();
  const {mutate: upsertValeur} = useUpsertValeurIndicateur();
  const {mutate: calcul, isLoading, isSuccess} = useCalculTrajectoire();

  return (
    <div className="text-center">
      <h3>Lancer un nouveau calcul</h3>
      <p>
        Vous pouvez lancer un calcul de la trajectoire SNBC territorialisée en
        complétant les données ci-après. Les données à entrer sont les résultats
        observés pour l’année 2015 : c’est l’année de référence de la SNBC v2.
      </p>
      <Tabs defaultActiveTab={0} onChange={() => {}}>
        {TABS.map(tab => {
          const {data} = donneesSectorisees[tab.id];
          const {
            sources,
            valeursSecteurs,
            indicateurTrajectoire,
            donneesCompletes,
          } = data || {};
          return (
            <Tab
              key={tab.id}
              label={tab.label}
              {...getTabProps(donneesCompletes)}
            >
              <Alert
                className="text-left"
                state="info"
                description={tab.description}
              />
              {sources && valeursSecteurs && (
                <TableauDonnees
                  indicateur={indicateurTrajectoire}
                  valeursSecteurs={valeursSecteurs}
                  sources={sources}
                  onChange={({indicateur_id, valeur}) => {
                    upsertValeur({
                      indicateur_id,
                      date_valeur: DATE_DEBUT,
                      resultat: valeur,
                    });
                  }}
                />
              )}
            </Tab>
          );
        })}
      </Tabs>
      <ModalFooter variant="right">
        <Button variant="outlined" onClick={() => modalProps.close()}>
          Annuler
        </Button>
        <Button
          icon={!isLoading ? 'arrow-right-line' : undefined}
          iconPosition="right"
          disabled={!donneesCompletes || !isLoading}
          onClick={() => {
            calcul();
            if (isSuccess) {
              modalProps.close();
            }
          }}
        >
          {isLoading ? (
            <>
              Calcul en cours
              <SpinnerLoader />
            </>
          ) : (
            'Voir le résultat'
          )}
        </Button>
      </ModalFooter>
    </div>
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
