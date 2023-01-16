/**
 * Affiche l'en-tête de page contenant l'objectif et le bouton pour candidater
 */

import {ReactNode, useState} from 'react';
import {useReferentielId} from 'core-logic/hooks/params';
import {PageHeaderLeft} from 'ui/PageHeader';
import {useHasActiveCOT, useIsAuditeur} from '../Audit/useAudit';
import {ValiderAudit} from '../Audit/ValiderAudit';
import {DemandeLabellisationModal} from './DemandeLabellisationModal';
import {numLabels} from './numLabels';
import {useParcoursLabellisation} from './useParcoursLabellisation';
import {useValidateAudit} from './useValidateAudit';

type TParcoursLabellisation = ReturnType<typeof useParcoursLabellisation>;

export type THeaderLabellisationProps = {
  parcours: TParcoursLabellisation['parcours'];
  demande: TParcoursLabellisation['demande'];
  audit: TParcoursLabellisation['audit'];
  isAuditeur: boolean;
  onStartAudit: () => void;
  onValidateAudit: ReturnType<typeof useValidateAudit>['mutate'];
};

export const HeaderLabellisation = (props: THeaderLabellisationProps) => {
  const [opened, setOpened] = useState(false);
  const {parcours, demande, audit, isAuditeur, onStartAudit, onValidateAudit} =
    props;

  if (!parcours) {
    return null;
  }

  const {
    etoiles,
    completude_ok,
    rempli,
    derniere_demande,
    derniere_labellisation,
  } = parcours;

  const demande_envoyee = demande && !demande.en_cours && derniere_demande;
  const audit_en_cours = audit && !audit.valide;
  const audit_valide = audit && audit.valide;

  // on peut soumettre la demande de labellisation si...
  const canSubmit =
    // la demande est toujours en cours
    !demande_envoyee &&
    // et le référentiel est rempli
    completude_ok &&
    // et tous les critères sont atteints
    rempli;

  return (
    <PageHeaderLeft>
      {derniere_labellisation ? (
        <p className="m-0">
          <span className="capitalize">
            {numLabels[derniere_labellisation.etoiles]}
          </span>{' '}
          étoile depuis le{' '}
          {new Date(derniere_labellisation.obtenue_le).toLocaleDateString(
            'fr-FR',
            {dateStyle: 'long'}
          )}
        </p>
      ) : null}
      <h2 className="fr-mb-2w">Objectif : {numLabels[etoiles]} étoile</h2>
      {!demande_envoyee && !audit_en_cours && !isAuditeur ? (
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
      {demande_envoyee && !audit_en_cours && isAuditeur ? (
        <button className="fr-btn self-start" onClick={onStartAudit}>
          Commencer l'audit
        </button>
      ) : null}
      {demande_envoyee && !audit ? (
        <HeaderMessage>Demande envoyée</HeaderMessage>
      ) : null}
      {audit_valide ? (
        <HeaderMessage>Labellisation en cours</HeaderMessage>
      ) : null}
      {audit_en_cours && !isAuditeur ? (
        <HeaderMessage>Audit en cours</HeaderMessage>
      ) : null}
      {audit_en_cours && isAuditeur ? (
        <ValiderAudit
          audit={audit}
          onValidate={audit => audit && onValidateAudit(audit)}
        />
      ) : null}
      {demande && !demande_envoyee ? (
        <DemandeLabellisationModal
          demande={demande}
          parcours={parcours}
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

const HeaderLabellisationConnected = () => {
  const hasActiveCOT = useHasActiveCOT();

  const referentiel = useReferentielId();
  const parcoursLabellisation = useParcoursLabellisation(referentiel);
  const isAuditeur = useIsAuditeur();
  const {parcours, demande, audit} = parcoursLabellisation;
  const onStartAudit = () => {
    console.log('TODO');
  };
  const {mutate: onValidateAudit} = useValidateAudit();

  return parcours || hasActiveCOT ? (
    <HeaderLabellisation
      parcours={parcours}
      demande={demande}
      audit={audit}
      isAuditeur={isAuditeur}
      onStartAudit={onStartAudit}
      onValidateAudit={onValidateAudit}
    />
  ) : null;
};

export default HeaderLabellisationConnected;
