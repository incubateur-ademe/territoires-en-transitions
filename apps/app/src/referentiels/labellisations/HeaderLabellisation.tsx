/**
 * Affiche l'en-tête de page contenant l'objectif et le bouton pour candidater
 */
import { Button } from '@/ui';
import { useState } from 'react';
import { TAuditeur, useAuditeurs } from '../audits/useAudit';
import { ValiderAuditButton } from '../audits/valider-audit.button';
import { DemandeAuditModal } from './DemandeAuditModal';
import { DemandeLabellisationModal } from './DemandeLabellisationModal';
import { numLabels } from './numLabels';
import { TEtoiles } from './types';
import { TCycleLabellisation } from './useCycleLabellisation';
import { useStartAudit } from './useStartAudit';

export type THeaderLabellisationProps = {
  parcoursLabellisation: TCycleLabellisation;
};

export const HeaderLabellisation = (props: THeaderLabellisationProps) => {
  const [opened, setOpened] = useState(false);
  const [opened_1ereEtoileCOT, setOpened_1ereEtoileCOT] = useState(false);
  const { mutate: onStartAudit } = useStartAudit();
  const { parcoursLabellisation } = props;
  const {
    parcours,
    status,
    isAuditeur,
    isCOT,
    peutDemanderEtoile,
    peutCommencerAudit,
  } = parcoursLabellisation;

  const { data: auditeurs } = useAuditeurs();

  if (!parcours) {
    return null;
  }

  const headerMessageContent = getHeaderMessageContent(
    parcoursLabellisation,
    auditeurs
  );
  const { etoiles, audit, completude_ok, labellisation } = parcours;
  const canSubmitDemande = peutDemanderEtoile || (isCOT && completude_ok);
  const DemandeModal = isCOT ? DemandeAuditModal : DemandeLabellisationModal;

  return (
    <div className="sticky top-0 z-40 w-full my-8 p-4 bg-primary-3">
      <DerniereLabellisation parcoursLabellisation={parcoursLabellisation} />
      <h2 className="mb-4">
        Objectif :{' '}
        {labellisation && labellisation.etoiles === 5
          ? 'renouveler la labellisation'
          : `${numLabels[etoiles]} étoile`}
      </h2>
      {status === 'non_demandee' && !isAuditeur ? (
        <>
          {etoiles === 1 && isCOT ? (
            <Button
              dataTest="1ereEtoileCOT"
              size="sm"
              disabled={!peutDemanderEtoile}
              onClick={() => setOpened_1ereEtoileCOT(true)}
            >
              Demander la première étoile
            </Button>
          ) : null}
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
      ) : null}
      {audit && peutCommencerAudit ? (
        <Button
          dataTest="StartAuditBtn"
          size="sm"
          onClick={() =>
            onStartAudit({
              auditId: audit.id!,
            })
          }
        >
          {"Commencer l'audit"}
        </Button>
      ) : null}
      {!!headerMessageContent && (
        <p className="text-grey-8" data-test="HeaderMessage">
          {headerMessageContent}
        </p>
      )}
      {audit && status === 'audit_en_cours' && isAuditeur ? (
        <ValiderAuditButton auditId={audit.id!} demandeId={audit.demande_id} />
      ) : null}
      {status === 'non_demandee' || status === 'demande_envoyee' ? (
        <>
          <DemandeModal
            parcoursLabellisation={parcoursLabellisation}
            isCOT={isCOT}
            opened={opened}
            setOpened={setOpened}
          />
          {etoiles === 1 && isCOT ? (
            <DemandeLabellisationModal
              parcoursLabellisation={parcoursLabellisation}
              opened={opened_1ereEtoileCOT}
              setOpened={setOpened_1ereEtoileCOT}
              isCOT={isCOT}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
};

// renvoi le message d'entête correspondant au positionnement de la collectivité
// dans le parcours de labellisation
const getHeaderMessageContent = (
  parcoursLabellisation: TCycleLabellisation,
  auditeurs: TAuditeur[] | null | undefined
) => {
  const { status, isAuditeur, peutCommencerAudit } = parcoursLabellisation;

  if (status === 'demande_envoyee' && !peutCommencerAudit) {
    return 'Demande envoyée';
  }

  const listeAuditeurs = auditeurs
    ?.map(({ prenom, nom }) => `${prenom} ${nom}`)
    .join(', ');

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

  return (
    <p className="m-0">
      <span className="capitalize">
        {numLabels[etoiles as unknown as TEtoiles]}
      </span>{' '}
      étoile depuis le{' '}
      {new Date(obtenue_le!).toLocaleDateString('fr-FR', {
        dateStyle: 'long',
      })}
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
