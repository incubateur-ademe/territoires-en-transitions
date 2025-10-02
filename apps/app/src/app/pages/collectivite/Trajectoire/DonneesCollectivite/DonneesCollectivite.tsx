import { useCollectiviteId } from '@/api/collectivites';
import { DATE_DEBUT } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import { Alert, Button, ModalFooter, RenderProps, Tab, Tabs } from '@/ui';
import { useUpsertIndicateurValeur } from '../../../../../indicateurs/valeurs/use-upsert-indicateur-valeur';
import { useComputeTrajectoire } from '../use-trajectoire';
import { TABS } from './constants';
import { Secteur, TableauDonnees } from './TableauDonnees';
import { useDonneesSectorisees } from './useDonneesSectorisees';

export type DonneesCollectiviteProps = {
  modalProps: RenderProps;
};

/**
 * Affiche le contenu de la modale permettant de saisir les données de la
 * collectivité et de lancer un nouveau calcul
 */
export const DonneesCollectivite = ({
  modalProps,
}: DonneesCollectiviteProps) => {
  const { donneesCompletes, donneesSectorisees } = useDonneesSectorisees();
  const { mutate: upsertValeur } = useUpsertIndicateurValeur();

  const collectiviteId = useCollectiviteId();

  const { mutate: computeTrajectoire, isPending: isComputePending } =
    useComputeTrajectoire({
      onSuccess: () => {
        modalProps.close();
      },
    });

  return (
    <div className="text-center">
      <h3>Recalculer la trajectoire</h3>
      <p>
        Vous pouvez lancer un calcul de la trajectoire SNBC territorialisée en
        complétant les données ci-après. Les données à entrer sont les résultats
        observés pour l’année 2015 : c’est l’année de référence de la SNBC v2.
      </p>
      <Tabs defaultActiveTab={0}>
        {TABS.map((tab) => {
          const { data } = donneesSectorisees[tab.id];

          const { secteurs, sources, valeursSecteurs, donneesCompletes } =
            data || {};
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
                  valeursSecteurs={valeursSecteurs}
                  secteurs={secteurs as unknown as Secteur[]}
                  sources={sources}
                  onChange={({ indicateurId, valeur }) => {
                    upsertValeur({
                      indicateurId,
                      dateValeur: DATE_DEBUT,
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
          icon="arrow-right-line"
          iconPosition="right"
          loading={isComputePending}
          disabled={!donneesCompletes}
          onClick={() => {
            computeTrajectoire({ collectiviteId });
          }}
        >
          {isComputePending ? '  Calcul en cours' : 'Voir le résultat'}
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
