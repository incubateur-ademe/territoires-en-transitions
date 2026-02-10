/**
 * Affiche l'en-tête de page contenant l'objectif et le bouton pour candidater
 */
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { useAuditeurs } from '../audits/useAudit';
import { ValiderAuditButton } from '../audits/valider-audit.button';
import { DemandeAuditModal } from './DemandeAuditModal';
import { DemandeLabellisationModal } from './DemandeLabellisationModal';
import { numLabels } from './numLabels';
import { TLabellisationParcours } from './types';
import { TCycleLabellisation } from './useCycleLabellisation';
import { useStartAudit } from './useStartAudit';

function StartAuditButton({ auditId }: { auditId: number }) {
  const { mutate: onStartAudit } = useStartAudit();
  return (
    <Button
      dataTest="StartAuditBtn"
      size="sm"
      onClick={() => {
        onStartAudit({
          auditId,
        });
      }}
    >
      {"Commencer l'audit"}
    </Button>
  );
}

function ApplyAuditButton({
  parcoursLabellisation,
  parcours,
}: {
  parcoursLabellisation: TCycleLabellisation;
  parcours: TLabellisationParcours;
}) {
  const [opened, setOpened] = useState(false);
  const [opened_1ereEtoileCOT, setOpened_1ereEtoileCOT] = useState(false);

  const { isCOT, peutDemander1ereEtoileCOT, peutDemanderEtoile, status } =
    parcoursLabellisation;

  const { etoiles, completude_ok } = parcours;

  const canSubmitDemande = peutDemanderEtoile || (isCOT && completude_ok);

  const DemandeModal = isCOT ? DemandeAuditModal : DemandeLabellisationModal;

  return (
    <>
      {status === 'non_demandee' && (
        <>
          {etoiles === 1 && isCOT && (
            <Button
              className="mb-4"
              dataTest="1ereEtoileCOT"
              size="sm"
              disabled={!peutDemander1ereEtoileCOT}
              onClick={() => setOpened_1ereEtoileCOT(true)}
            >
              Demander la première étoile
            </Button>
          )}
          <Button
            dataTest="SubmitDemandeBtn"
            size="sm"
            disabled={!canSubmitDemande}
            onClick={() => setOpened(true)}
          >
            {etoiles === 1 && !isCOT
              ? 'Demander la première étoile'
              : 'Demander un audit'}
          </Button>
        </>
      )}
      <>
        <DemandeModal
          parcoursLabellisation={parcoursLabellisation}
          isCOT={isCOT}
          opened={opened}
          setOpened={setOpened}
        />
        {etoiles === 1 && isCOT && (
          <DemandeLabellisationModal
            parcoursLabellisation={parcoursLabellisation}
            opened={opened_1ereEtoileCOT}
            setOpened={setOpened_1ereEtoileCOT}
            isCOT={isCOT}
          />
        )}
      </>
    </>
  );
}

type THeaderLabellisationProps = {
  parcoursLabellisation: TCycleLabellisation;
};

export const HeaderLabellisation = (props: THeaderLabellisationProps) => {
  const { hasCollectivitePermission } = useCurrentCollectivite();

  const canMutateReferentiel = hasCollectivitePermission('referentiels.mutate');
  const canStartAuditReferentiel = hasCollectivitePermission(
    'referentiels.labellisations.start_audit'
  );
  const canValidateAuditReferentiel = hasCollectivitePermission(
    'referentiels.labellisations.validate_audit'
  );

  const { parcoursLabellisation } = props;
  const { parcours, status, isAuditeur, peutCommencerAudit } =
    parcoursLabellisation;

  const { data: auditeurs } = useAuditeurs();

  if (!parcours) {
    return null;
  }

  const headerMessageContent = getHeaderMessageContent(
    parcoursLabellisation,
    auditeurs
  );
  const { etoiles, audit, labellisation } = parcours;

  return (
    <div className="sticky top-0 z-40 w-full my-8 p-4 bg-primary-3">
      <DerniereLabellisation parcoursLabellisation={parcoursLabellisation} />

      <h2 className="mb-4">
        Objectif :{' '}
        {labellisation && labellisation.etoiles === 5
          ? 'renouveler la labellisation'
          : `${numLabels[etoiles]} étoile`}
      </h2>

      {canMutateReferentiel && !isAuditeur && (
        <ApplyAuditButton
          parcoursLabellisation={parcoursLabellisation}
          parcours={parcours}
        />
      )}

      {canStartAuditReferentiel && audit && peutCommencerAudit && (
        <StartAuditButton auditId={audit.id} />
      )}

      {!!headerMessageContent && (
        <p className="text-grey-8" data-test="HeaderMessage">
          {headerMessageContent}
        </p>
      )}

      {canValidateAuditReferentiel && audit && status === 'audit_en_cours' && (
        <ValiderAuditButton auditId={audit.id} demandeId={audit.demande_id} />
      )}
    </div>
  );
};

// renvoi le message d'entête correspondant au positionnement de la collectivité
// dans le parcours de labellisation
const getHeaderMessageContent = (
  parcoursLabellisation: TCycleLabellisation,
  auditeurs: { userId: string; nom: string }[] | null | undefined
) => {
  const { status, isAuditeur, peutCommencerAudit } = parcoursLabellisation;

  if (status === 'demande_envoyee' && !peutCommencerAudit) {
    return 'Demande envoyée';
  }

  const listeAuditeurs = auditeurs?.map((auditeur) => auditeur.nom).join(', ');

  if (status === 'audit_en_cours' && !isAuditeur) {
    return 'Audit en cours' + (listeAuditeurs ? `, par ${listeAuditeurs}` : '');
  }

  if (status === 'audit_valide') {
    return (
      'Labellisation en cours' +
      (listeAuditeurs ? ` - audité par ${listeAuditeurs}` : '')
    );
  }

  // pas de message dans les autres cas
  return null;
};

/** Message  "<n-ième> étoile depuis le <date obtention>" */
const DerniereLabellisation = ({
  parcoursLabellisation,
}: {
  parcoursLabellisation: TCycleLabellisation;
}) => {
  const { parcours } = parcoursLabellisation;
  const { labellisation } = parcours || {};
  const { etoiles, obtenue_le } = labellisation || {};

  if (!etoiles) {
    return null;
  }
  const etoileLabel = etoiles
    ? numLabels[etoiles as keyof typeof numLabels]
    : null;

  const fromDate = obtenue_le
    ? new Date(obtenue_le).toLocaleDateString('fr-FR', {
        dateStyle: 'long',
      })
    : null;

  return (
    <p className="m-0">
      <span className="capitalize">{etoileLabel}</span> étoile depuis le{' '}
      {fromDate ? fromDate : null}
    </p>
  );
};

const HeaderLabellisationConnected = ({
  parcoursLabellisation,
}: {
  parcoursLabellisation: TCycleLabellisation;
}) => {
  return parcoursLabellisation?.parcours ? (
    <HeaderLabellisation parcoursLabellisation={parcoursLabellisation} />
  ) : null;
};

export default HeaderLabellisationConnected;
