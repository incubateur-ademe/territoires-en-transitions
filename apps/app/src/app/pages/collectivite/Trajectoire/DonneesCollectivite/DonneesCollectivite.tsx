import { DATE_DEBUT } from '@/app/app/pages/collectivite/Trajectoire/constants';
import { useCalculTrajectoire } from '@/app/app/pages/collectivite/Trajectoire/useCalculTrajectoire';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Alert, Button, ModalFooter, RenderProps, Tab, Tabs } from '@/ui';
import { useEffect } from 'react';
import { TABS } from './constants';
import { Secteur, TableauDonnees } from './TableauDonnees';
import { useDonneesSectorisees } from './useDonneesSectorisees';
import { useUpsertValeurIndicateur } from './useUpsertValeurIndicateur';

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
  const { mutate: upsertValeur } = useUpsertValeurIndicateur();
  const { isPending, isSuccess, refetch } = useCalculTrajectoire({
    nouveauCalcul: true,
  });

  // ferme le dialogue quand le nouveau calcul est terminé
  useEffect(() => {
    if (isSuccess) {
      modalProps.close();
    }
  }, [isSuccess]);

  return (
    <div className="text-center">
      <h3>Lancer un nouveau calcul</h3>
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
          icon={!isPending ? 'arrow-right-line' : undefined}
          iconPosition="right"
          disabled={!donneesCompletes || isPending}
          onClick={() => refetch()}
        >
          {isPending ? (
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
