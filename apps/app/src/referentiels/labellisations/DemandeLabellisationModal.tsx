import { appLabels } from '@/app/labels/catalog';
import { Etoile } from '@tet/domain/referentiels';
import { Alert, Button, Modal } from '@tet/ui';
import { MessageCompletudeECi } from './MessageCompletudeECi';
import { numLabels } from './numLabels';
import { TCycleLabellisation } from './useCycleLabellisation';
import { useEnvoiDemande } from './useEnvoiDemande';

export type TDemandeLabellisationModalProps = {
  isCOT: boolean;
  parcoursLabellisation: TCycleLabellisation;
  opened: boolean;
  setOpened: (opened: boolean) => void;
};

const messageEtoile_1 = [appLabels.bravoConditionsPremiereEtoile];

const messageEtoile_2_3_4_ECI = [
  appLabels.bravoConditionsAuditAvecParenthese({
    parenthese: appLabels.parentheseCalendrierDesignationAuditeur,
  }),
  appLabels.recommandeMargeMinimaleEtoile,
];

const messageEtoile_2_3_4_CAE = [
  appLabels.bravoConditionsAuditAvecParenthese({
    parenthese: appLabels.parentheseCalendrierDossierDesignationAuditeur,
  }),
  appLabels.recommandeMargeMinimaleEtoile,
];

const messageEtoile_5 = [
  appLabels.bravoConditionsAuditAvecParenthese({
    parenthese: appLabels.parentheseCalendrierEuropeenAuditeurs,
  }),
  appLabels.recommandeMargeMinimaleEtoile,
];

export const submittedEtoile1 = appLabels.demandeLabellisationEnvoyee;
export const submittedAutresEtoiles = appLabels.demandeAuditEnvoyee;

const getMessage = (parcours: TCycleLabellisation['parcours']) => {
  const { etoiles, referentiel } = parcours || {};
  if (!etoiles) {
    return null;
  }
  if (etoiles === 1) {
    return messageEtoile_1;
  }
  if (etoiles === 5) {
    return messageEtoile_5;
  }
  if (referentiel === 'eci') {
    return messageEtoile_2_3_4_ECI;
  }
  return messageEtoile_2_3_4_CAE;
};

/**
 * Affiche la modale d'envoi de la demande d'audit
 */
export const DemandeLabellisationModal = (
  props: TDemandeLabellisationModalProps
) => {
  const { parcoursLabellisation, opened, setOpened } = props;
  const { parcours, status } = parcoursLabellisation;

  // n'affiche rien si les donnnées ne sont pas valides
  if (
    !parcours?.collectivite_id &&
    status !== 'non_demandee' &&
    status !== 'demande_envoyee'
  ) {
    return null;
  }

  return (
    <Modal
      openState={{
        isOpen: opened,
        setIsOpen: setOpened,
      }}
      size="lg"
      render={({ close }) => (
        <DemandeLabellisationModalContent {...props} onClose={close} />
      )}
    />
  );
};

const getTitle = (etoile: Etoile | undefined): string => {
  if (!etoile) {
    return appLabels.demanderUnAudit;
  }
  if (etoile === 1) {
    return appLabels.demanderLaPremiereEtoile;
  }
  return appLabels.demanderAuditPourEtoile({ numLabel: numLabels[etoile] });
};

export const DemandeLabellisationModalContent = (
  props: TDemandeLabellisationModalProps & { onClose: () => void }
) => {
  const { isPending: isLoading, mutate: envoiDemande } = useEnvoiDemande();
  const { parcoursLabellisation, onClose } = props;
  const { parcours, status } = parcoursLabellisation;
  const { collectivite_id, referentiel, etoiles } = parcours || {};

  const canSubmit = referentiel && etoiles;

  return (
    <div className="flex flex-col" data-test="DemandeLabellisationModal">
      <h3 className="mb-6">{getTitle(etoiles)}</h3>
      <div className="w-full">
        {status === 'non_demandee' && isLoading
          ? appLabels.envoiEnCoursLabel
          : null}
        {status === 'demande_envoyee' ? (
          <Alert
            state="success"
            className="mb-4"
            title={etoiles === 1 ? submittedEtoile1 : submittedAutresEtoiles}
          />
        ) : null}
        {status === 'non_demandee' && !isLoading ? (
          <>
            {getMessage(parcours)?.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
            <MessageCompletudeECi parcours={parcours} />
            <div className="flex gap-4">
              <Button
                dataTest="EnvoyerDemandeBtn"
                size="sm"
                disabled={!canSubmit}
                onClick={() => {
                  if (canSubmit && collectivite_id) {
                    envoiDemande({
                      collectiviteId: collectivite_id,
                      referentiel,
                      etoiles,
                      sujet: 'labellisation',
                    });
                  }
                }}
              >
                {appLabels.envoyerMaDemandeLabel}
              </Button>
              {etoiles !== 1 && (
                <Button variant="outlined" size="sm" onClick={onClose}>
                  {appLabels.revenirPreparationAudit}
                </Button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
