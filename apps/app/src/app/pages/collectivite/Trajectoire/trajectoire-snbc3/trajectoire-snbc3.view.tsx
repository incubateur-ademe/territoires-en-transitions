import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { StatutTrajectoireSnbc3 } from '@tet/domain/indicateurs';
import { Alert } from '@tet/ui';
import { ReactNode } from 'react';
import { match } from 'ts-pattern';
import { useGetStatutTrajectoireSnbc3 } from './data/use-get-statut-trajectoire-snbc3';
import { TrajectoireSnbc3DisponibleView } from './trajectoire-snbc3-disponible.view';
import { TrajectoireSnbc3IndisponibleCard } from './trajectoire-snbc3-indisponible.card';

/**
 * Page Trajectoire avec le flag `is-trajectoire-snbc3-enabled` : la
 * trajectoire SNBC 3 importée, sans calcul ni saisie. Au lot 6, elle remplace
 * l'ancienne page.
 */
export const TrajectoireSnbc3View = ({
  fallback,
}: {
  /**
   * Page affichée si le backend refuse la SNBC 3 alors que le front a le flag
   * (évaluation PostHog différente, par exemple ciblée par collectivité).
   */
  fallback: ReactNode;
}) => {
  const { data, error, isLoading } = useGetStatutTrajectoireSnbc3();

  if (isLoading) {
    return (
      <div className="h-56 flex justify-center items-center">
        <SpinnerLoader className="w-8 h-8 fill-primary-5" />
      </div>
    );
  }

  if (error?.data?.errorKey === 'TRAJECTOIRE_SNBC3_NON_OUVERTE') {
    return fallback;
  }

  if (error || !data) {
    return (
      <Alert
        state="error"
        className="self-stretch my-8"
        title={appLabels.trajectoireErreurChargementDonnees}
        description={appLabels.trajectoireErreurChargementDonneesDescription}
      />
    );
  }

  return match(data.status)
    .with(StatutTrajectoireSnbc3.DROITS_INSUFFISANTS, () => (
      <Alert
        state="error"
        className="self-stretch my-8"
        title={appLabels.trajectoireDroitsInsuffisants}
        description={appLabels.trajectoireDroitsInsuffisantsDescription}
      />
    ))
    .with(StatutTrajectoireSnbc3.DISPONIBLE, () => (
      <TrajectoireSnbc3DisponibleView millesime={data.millesime} />
    ))
    .with(StatutTrajectoireSnbc3.ABSENT_DU_MILLESIME, () => (
      <TrajectoireSnbc3IndisponibleCard
        title={appLabels.trajectoireSnbc3AbsentDuMillesimeTitre}
        description={appLabels.trajectoireSnbc3AbsentDuMillesimeDescription}
        dataTest="indicateurs.trajectoires.snbc3.absent-du-millesime"
      />
    ))
    .with(StatutTrajectoireSnbc3.COMMUNE_NON_SUPPORTEE, () => (
      <TrajectoireSnbc3IndisponibleCard
        title={appLabels.trajectoireSnbc3CommuneTitre}
        description={
          data.epciParent
            ? appLabels.trajectoireSnbc3CommuneAvecEpciDescription
            : appLabels.trajectoireSnbc3CommuneDescription
        }
        epciParent={data.epciParent}
        dataTest="indicateurs.trajectoires.snbc3.commune-non-supportee"
      />
    ))
    .with(StatutTrajectoireSnbc3.SUPRA_NON_SUPPORTE, () => (
      <TrajectoireSnbc3IndisponibleCard
        title={appLabels.trajectoireSnbc3SupraTitre}
        description={appLabels.trajectoireSnbc3SupraDescription}
        dataTest="indicateurs.trajectoires.snbc3.supra-non-supporte"
      />
    ))
    .exhaustive();
};
