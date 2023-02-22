import {referentielToName} from 'app/labels';
import {Fragment} from 'react';
import {Referentiel} from 'types/litterals';
import PreuveDoc from 'ui/shared/preuves/Bibliotheque/PreuveDoc';
import {TPreuveAuditEtLabellisation} from 'ui/shared/preuves/Bibliotheque/types';
import {useIsAuditAuditeur} from '../Audit/useAudit';
import {getParcoursStatus} from '../ParcoursLabellisation/getParcoursStatus';
import {numLabels} from '../ParcoursLabellisation/numLabels';
import {groupeParReferentielEtDemande} from './groupeParReferentielEtDemande';

/**
 * Affiche les documents d'audit et labellisation, groupés par référentiel et
 * par demande de labellisation ou d'audit.
 */
export const PreuvesLabellisation = ({
  preuves,
}: {
  preuves: TPreuveAuditEtLabellisation[];
}) => {
  const parReferentiel = groupeParReferentielEtDemande(preuves);
  return (
    <>
      {Object.entries(parReferentiel).map(
        ([referentiel, preuvesReferentiel]) => {
          const parDemande = Object.entries(preuvesReferentiel);
          return (
            <Fragment key={referentiel}>
              <h2>
                Documents d'audit et de labellisation - Référentiel{' '}
                {referentielToName[referentiel as Referentiel]}
              </h2>
              {parDemande.map(([demande_id, docs]) => {
                return (
                  <DocsAuditOuLabellisation
                    key={demande_id}
                    date={demande_id}
                    preuves={docs}
                  />
                );
              })}
            </Fragment>
          );
        }
      )}
    </>
  );
};

/**
 * Affiche le sous-ensemble des documents d'une demande de labellisation ou
 * d'audit.
 */
const DocsAuditOuLabellisation = (props: {
  date: string;
  preuves: TPreuveAuditEtLabellisation[];
}) => {
  const {date, preuves} = props;

  return (
    <Fragment>
      <Title date={date} preuves={preuves} />
      {preuves.map(preuve => (
        <DocAuditOuLabellisation key={preuve.id} preuve={preuve} />
      ))}
    </Fragment>
  );
};

const DocAuditOuLabellisation = ({
  preuve,
}: {
  preuve: TPreuveAuditEtLabellisation;
}) => {
  const {audit} = preuve;
  const isAuditeur = useIsAuditAuditeur(audit?.id);
  const status = getParcoursStatus(preuve);

  // le document n'est pas éditable si...
  const readonly =
    // ... c'est le rapport d’un audit en cours et l'utilisateur n'est pas auditeur
    (preuve.preuve_type === 'audit' &&
      status === 'audit_en_cours' &&
      !isAuditeur) ||
    //... ou si l'audit est validé
    status === 'audit_valide' ||
    false;

  return (
    <PreuveDoc preuve={preuve} readonly={readonly} classComment="pb-0 mb-2" />
  );
};

/**
 * Affiche le titre d'un sous-ensemble de documents d'une demande de
 * labellisation ou d'audit.
 */
const Title = (props: {
  date: string;
  preuves: TPreuveAuditEtLabellisation[];
}) => {
  const {date, preuves} = props;
  const annee = new Date(date).getFullYear();
  const demande = preuves.find(p => p.demande)?.demande;
  const audit = preuves?.find(p => p.audit)?.audit;

  const etoile = demande?.etoiles;
  const labelEtoile = etoile ? (numLabels[etoile] as string) : null;
  const en_cours = (!audit && demande?.en_cours) || (audit && !audit.valide);
  const label = annee + (en_cours ? ' (en cours)' : '') + ' - ';

  if (etoile) {
    return (
      <h3>
        {label}
        <span className="capitalize">{labelEtoile}</span> étoile
      </h3>
    );
  }

  if (audit) {
    return (
      <h3>
        {label}
        <span>Audit contrat d'objectif territorial (COT)</span>
      </h3>
    );
  }

  return null;
};
