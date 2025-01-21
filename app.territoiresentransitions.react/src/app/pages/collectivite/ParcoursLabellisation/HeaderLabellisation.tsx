/**
 * Affiche l'en-tête de page contenant l'objectif et le bouton pour candidater
 */

import { useReferentielId } from '@/app/core-logic/hooks/params';
import { PageContainer } from '@/app/ui/layout/page-layout';
import { ReactNode, useState } from 'react';
import { TAuditeur, useAuditeurs } from '../Audit/useAudit';
import { ValiderAudit } from '../Audit/ValiderAudit';
import { DemandeAuditModal } from './DemandeAuditModal';
import { DemandeLabellisationModal } from './DemandeLabellisationModal';
import { numLabels } from './numLabels';
import { TEtoiles } from './types';
import {
  TCycleLabellisation,
  useCycleLabellisation,
} from './useCycleLabellisation';
import { TStartAudit, useStartAudit } from './useStartAudit';
import { TValidateAudit, useValidateAudit } from './useValidateAudit';

export type THeaderLabellisationProps = {
  parcoursLabellisation: TCycleLabellisation;
  onStartAudit: TStartAudit;
  onValidateAudit: TValidateAudit;
};

export const HeaderLabellisation = (props: THeaderLabellisationProps) => {
  const [opened, setOpened] = useState(false);
  const [opened_1ereEtoileCOT, setOpened_1ereEtoileCOT] = useState(false);
  const { parcoursLabellisation, onStartAudit, onValidateAudit } = props;
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
  const { collectivite_id, referentiel, etoiles, audit, completude_ok } =
    parcours;
  const canSubmitDemande = peutDemanderEtoile || (isCOT && completude_ok);
  const DemandeModal = isCOT ? DemandeAuditModal : DemandeLabellisationModal;

  return (
    <div className="sticky top-0 z-40 bg-bf925 w-full min-h-[112px] flex items-center justify-center mt-8">
      <PageContainer className="my-4">
        <DerniereLabellisation parcoursLabellisation={parcoursLabellisation} />
        <h2 className="mb-4">Objectif : {numLabels[etoiles]} étoile</h2>
        {status === 'non_demandee' && !isAuditeur ? (
          <>
            {etoiles === '1' && isCOT ? (
              <button
                className="fr-btn self-start fr-mr-2w"
                data-test="1ereEtoileCOT"
                disabled={!peutDemanderEtoile}
                onClick={() => setOpened_1ereEtoileCOT(true)}
              >
                Demander la première étoile
              </button>
            ) : null}
            <button
              className="fr-btn self-start"
              data-test="SubmitDemandeBtn"
              disabled={!canSubmitDemande}
              onClick={() => setOpened(true)}
            >
              {etoiles === '1' && !isCOT
                ? 'Demander la première étoile'
                : 'Demander un audit'}
            </button>
          </>
        ) : null}
        {peutCommencerAudit ? (
          <button
            className="fr-btn self-start"
            data-test="StartAuditBtn"
            onClick={() =>
              audit &&
              referentiel &&
              onStartAudit({
                collectivite_id,
                referentiel,
                audit_id: audit.id!,
              })
            }
          >
            Commencer l'audit
          </button>
        ) : null}
        {!!headerMessageContent && (
          <HeaderMessage>{headerMessageContent}</HeaderMessage>
        )}
        {status === 'audit_en_cours' && isAuditeur ? (
          <ValiderAudit
            audit={audit!}
            onValidate={(audit) => onValidateAudit(audit!)}
          />
        ) : null}
        {status === 'non_demandee' || status === 'demande_envoyee' ? (
          <>
            <DemandeModal
              parcoursLabellisation={parcoursLabellisation}
              isCOT={isCOT}
              opened={opened}
              setOpened={setOpened}
            />
            {etoiles === '1' && isCOT ? (
              <DemandeLabellisationModal
                parcoursLabellisation={parcoursLabellisation}
                opened={opened_1ereEtoileCOT}
                setOpened={setOpened_1ereEtoileCOT}
                isCOT={isCOT}
              />
            ) : null}
          </>
        ) : null}
      </PageContainer>
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

const HeaderMessage = ({ children }: { children: ReactNode }) => (
  <p className="m-0 fr-text-mention--grey" data-test="HeaderMessage">
    {children}
  </p>
);

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

const HeaderLabellisationConnected = () => {
  const referentiel = useReferentielId();
  const parcoursLabellisation = useCycleLabellisation(referentiel);
  const { mutate: onStartAudit } = useStartAudit();
  const { mutate: onValidateAudit } = useValidateAudit();

  return parcoursLabellisation?.parcours ? (
    <HeaderLabellisation
      parcoursLabellisation={parcoursLabellisation}
      onStartAudit={onStartAudit}
      onValidateAudit={onValidateAudit}
    />
  ) : null;
};

export default HeaderLabellisationConnected;
