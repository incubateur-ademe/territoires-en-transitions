import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { useAuditeurs } from '../audits/useAudit';
import { CloturerAuditButton } from '../audits/cloture/cloturer-audit.button';
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
      {appLabels.commencerLAudit}
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
              {appLabels.obtenirPremiereEtoile}
            </Button>
          )}
          <Button
            dataTest="SubmitDemandeBtn"
            size="sm"
            disabled={!canSubmitDemande}
            onClick={() => setOpened(true)}
          >
            {etoiles === 1 && !isCOT
              ? appLabels.obtenirPremiereEtoile
              : appLabels.demanderAudit}
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

  const { parcoursLabellisation } = props;
  const { parcours, status, isAuditeur, canStartAudit } =
    parcoursLabellisation;

  const canMutateReferentiel = hasCollectivitePermission('referentiels.mutate');
  const canStartAuditReferentiel = hasCollectivitePermission(
    'referentiels.labellisations.start_audit'
  );
  const canValidateAuditReferentiel = hasCollectivitePermission(
    'referentiels.labellisations.validate_audit'
  );

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
        {labellisation && labellisation.etoiles === 5
          ? appLabels.objectifRenouveler
          : appLabels.objectifEtoile({ etoileLabel: numLabels[etoiles] })}
      </h2>

      {canMutateReferentiel && !isAuditeur && (
        <ApplyAuditButton
          parcoursLabellisation={parcoursLabellisation}
          parcours={parcours}
        />
      )}

      {canStartAuditReferentiel && audit && canStartAudit && (
        <StartAuditButton auditId={audit.id} />
      )}

      {!!headerMessageContent && (
        <p className="text-grey-8" data-test="HeaderMessage">
          {headerMessageContent}
        </p>
      )}

      {canValidateAuditReferentiel && audit && status === 'audit_en_cours' && (
        <CloturerAuditButton auditId={audit.id} demandeId={audit.demande_id} />
      )}
    </div>
  );
};

const getHeaderMessageContent = (
  parcoursLabellisation: TCycleLabellisation,
  auditeurs: { userId: string; nom: string }[] | null | undefined
) => {
  const { status, isAuditeur, canStartAudit } = parcoursLabellisation;

  if (status === 'demande_envoyee' && !canStartAudit) {
    return appLabels.demandeEnvoyee;
  }

  const listeAuditeurs = auditeurs?.map((auditeur) => auditeur.nom).join(', ');

  if (status === 'audit_en_cours' && !isAuditeur) {
    return listeAuditeurs
      ? appLabels.auditEnCoursParAuditeurs({ listeAuditeurs })
      : appLabels.auditEnCours;
  }

  if (status === 'audit_valide') {
    return listeAuditeurs
      ? appLabels.labellisationEnCoursParAuditeurs({ listeAuditeurs })
      : appLabels.labellisationEnCours;
  }

  return null;
};

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
      <span className="capitalize">{etoileLabel}</span>{' '}
      {appLabels.etoileDepuisLe} {fromDate ? fromDate : null}
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
