import { useCollectiviteId } from '@/api/collectivites';
import { DATE_DEBUT } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import { Alert, Button, ModalFooter, RenderProps, Tab, Tabs } from '@/ui';
import { useComputeTrajectoire } from '../use-trajectoire';
import { TABS } from './constants';
import { TableauDonnees } from './TableauDonnees';
import { useDonneesSectorisees } from './useDonneesSectorisees';
import { useUpsertValeurIndicateur } from './useUpsertValeurIndicateur';

export type DonneesCollectiviteProps = {
  modalProps: RenderProps;
};

const getTabProps = (canTrajectoireBeComputed: {
  isExhaustiveEnough: boolean;
  warningMessage?: string;
}): {
  icon: string;
  iconClassName: string;
  iconPosition: 'left' | 'right';
  title?: string;
} => {
  if (canTrajectoireBeComputed.isExhaustiveEnough) {
    return {
      icon: 'checkbox-circle-fill',
      iconClassName: 'text-success-3',
      iconPosition: 'right',
    };
  }

  return {
    icon: 'alert-fill',
    iconClassName: 'text-warning-1',
    iconPosition: 'right',
    title: canTrajectoireBeComputed.warningMessage,
  };
};

/**
 * Affiche le contenu de la modale permettant de saisir les données de la
 * collectivité et de lancer un nouveau calcul
 */
export const DonneesCollectivite = ({
  modalProps,
}: DonneesCollectiviteProps) => {
  const { donneesSectorisees } = useDonneesSectorisees();
  const { mutate: upsertValeur } = useUpsertValeurIndicateur();

  const collectiviteId = useCollectiviteId();

  const { mutate: computeTrajectoire, isPending: isComputePending } =
    useComputeTrajectoire({
      onSuccess: () => {
        modalProps.close();
      },
    });

  const canTrajectoireBeComputed = Object.values(donneesSectorisees).every(
    (d) => d.data.dataCompletionStatus.isExhaustiveEnough
  );
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

          const { secteurs, sources, valeursSecteurs, dataCompletionStatus } =
            data || {};

          return (
            <Tab
              key={tab.id}
              label={tab.label}
              {...getTabProps(dataCompletionStatus)}
            >
              <Alert
                className="text-left"
                state="info"
                description={tab.description}
              />
              {valeursSecteurs && (
                <TableauDonnees
                  valeursSecteurs={valeursSecteurs}
                  secteurs={secteurs}
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
          disabled={canTrajectoireBeComputed === false}
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
