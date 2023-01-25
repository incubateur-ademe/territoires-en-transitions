/**
 * Affiche l'en-tête de page contenant l'objectif et le bouton pour candidater
 */

import {ReactNode, useState} from 'react';
import {useReferentielId} from 'core-logic/hooks/params';
import {PageHeaderLeft} from 'ui/PageHeader';
import {ValiderAudit} from '../Audit/ValiderAudit';
import {DemandeLabellisationModal} from './DemandeLabellisationModal';
import {numLabels} from './numLabels';
import {
  useParcoursLabellisation,
  TParcoursLabellisation,
} from './useParcoursLabellisation';
import {useStartAudit, TStartAudit} from './useStartAudit';
import {useValidateAudit, TValidateAudit} from './useValidateAudit';

export type THeaderLabellisationProps = {
  parcoursLabellisation: TParcoursLabellisation;
  onStartAudit: TStartAudit;
  onValidateAudit: TValidateAudit;
};

export const HeaderLabellisation = (props: THeaderLabellisationProps) => {
  const [opened, setOpened] = useState(false);
  const {parcoursLabellisation, onStartAudit, onValidateAudit} = props;
  const {parcours, demandeEnvoyee, auditEnCours, auditValide, isAuditeur} =
    parcoursLabellisation;

  if (!parcours) {
    return null;
  }

  const {
    collectivite_id,
    referentiel,
    etoiles,
    completude_ok,
    rempli,
    demande,
  } = parcours;
  const {audit} = demande || {};

  // on peut soumettre la demande de labellisation si...
  const canSubmit =
    // la demande est toujours en cours
    !demandeEnvoyee &&
    // et le référentiel est rempli
    completude_ok &&
    // et tous les critères sont atteints
    rempli;

  return (
    <PageHeaderLeft>
      <DerniereLabellisation parcoursLabellisation={parcoursLabellisation} />
      <h2 className="fr-mb-2w">Objectif : {numLabels[etoiles]} étoile</h2>
      {!demandeEnvoyee && !auditEnCours && !isAuditeur ? (
        <button
          className="fr-btn self-start"
          disabled={!canSubmit}
          onClick={() => setOpened(true)}
        >
          {etoiles === '1'
            ? 'Demander la première étoile'
            : 'Demander un audit'}
        </button>
      ) : null}
      {demandeEnvoyee && !auditEnCours && isAuditeur ? (
        <button
          className="fr-btn self-start"
          onClick={() =>
            audit &&
            referentiel &&
            onStartAudit({collectivite_id, referentiel, audit_id: audit.id})
          }
        >
          Commencer l'audit
        </button>
      ) : null}
      {demandeEnvoyee && !audit ? (
        <HeaderMessage>Demande envoyée</HeaderMessage>
      ) : null}
      {auditValide ? (
        <HeaderMessage>Labellisation en cours</HeaderMessage>
      ) : null}
      {auditEnCours && !isAuditeur ? (
        <HeaderMessage>Audit en cours</HeaderMessage>
      ) : null}
      {audit && auditEnCours && isAuditeur ? (
        <ValiderAudit
          audit={audit}
          onValidate={audit => audit && onValidateAudit(audit)}
        />
      ) : null}
      {demande && !demandeEnvoyee ? (
        <DemandeLabellisationModal
          parcoursLabellisation={parcoursLabellisation}
          opened={opened}
          setOpened={setOpened}
        />
      ) : null}
    </PageHeaderLeft>
  );
};

const HeaderMessage = ({children}: {children: ReactNode}) => (
  <p className="m-0 fr-text-mention--grey" data-test="HeaderMessage">
    {children}
  </p>
);

/** Message  "<n-ième> étoile depuis le <date obtention>" */
const DerniereLabellisation = ({
  parcoursLabellisation,
}: {
  parcoursLabellisation: TParcoursLabellisation;
}) => {
  const {parcours} = parcoursLabellisation;
  const {derniere_labellisation} = parcours || {};
  const {etoiles, obtenue_le} = derniere_labellisation || {};

  if (!etoiles) {
    return null;
  }

  return (
    <p className="m-0">
      <span className="capitalize">{numLabels[etoiles]}</span> étoile depuis le{' '}
      {new Date(obtenue_le!).toLocaleDateString('fr-FR', {
        dateStyle: 'long',
      })}
    </p>
  );
};

const HeaderLabellisationConnected = () => {
  const referentiel = useReferentielId();
  const parcoursLabellisation = useParcoursLabellisation(referentiel);
  const {mutate: onStartAudit} = useStartAudit();
  const {mutate: onValidateAudit} = useValidateAudit();

  return parcoursLabellisation?.parcours ? (
    <HeaderLabellisation
      parcoursLabellisation={parcoursLabellisation}
      onStartAudit={onStartAudit}
      onValidateAudit={onValidateAudit}
    />
  ) : null;
};

export default HeaderLabellisationConnected;
