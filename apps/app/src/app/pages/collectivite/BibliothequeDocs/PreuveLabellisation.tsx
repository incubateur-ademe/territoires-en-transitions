import { referentielToName } from '@/app/app/labels';
import { getParcoursStatus } from '@/app/referentiels/labellisations/useCycleLabellisation';
import PreuveDoc from '@/app/referentiels/preuves/Bibliotheque/PreuveDoc';
import { TPreuveAuditEtLabellisation } from '@/app/referentiels/preuves/Bibliotheque/types';
import { ReferentielId } from '@/domain/referentiels';
import { Fragment } from 'react';
import { useIsAuditAuditeur } from '../../../../referentiels/audits/useAudit';
import { numLabels } from '../../../../referentiels/labellisations/numLabels';
import { groupeParReferentielEtDemande } from './groupeParReferentielEtDemande';

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
          const parDemande = Object.entries(preuvesReferentiel)
            .map(addInfoToEntry)
            .sort((a, b) => b.info.timestamp - a.info.timestamp);
          return (
            <Fragment key={referentiel}>
              <h2>
                {"Documents d'audit et de labellisation - Référentiel "}
                {referentielToName[referentiel as ReferentielId]}
              </h2>
              {parDemande.map(({ id, docs, info }, index) => {
                return (
                  <DocsAuditOuLabellisation
                    key={id}
                    preuves={docs}
                    info={info}
                    className={index ? 'mt-6' : undefined}
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
  className?: string;
  preuves: TPreuveAuditEtLabellisation[];
  info: TCycleInfo;
}) => {
  const { className, preuves, info } = props;

  return (
    <Fragment>
      <h3 className={className}>
        <Title info={info} />
      </h3>
      {preuves.map((preuve) => (
        <DocAuditOuLabellisation key={preuve.id} preuve={preuve} info={info} />
      ))}
    </Fragment>
  );
};

const DocAuditOuLabellisation = ({
  preuve,
  info,
}: {
  preuve: TPreuveAuditEtLabellisation;
  info: TCycleInfo;
}) => {
  const { audit } = preuve;
  const { status } = info;
  const isAuditeur = useIsAuditAuditeur(audit?.id ?? undefined);

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
const Title = (props: { info: TCycleInfo }) => {
  const { info } = props;
  const { etoile, status, annee, audit } = info;
  const labelEtoile = etoile ? (numLabels[etoile] as string) : null;
  const en_cours = status === 'demande_envoyee' || status === 'audit_en_cours';
  const label = annee + (en_cours ? ' (en cours)' : '') + ' - ';

  if (etoile) {
    return (
      <>
        {label}
        <span className="capitalize">{labelEtoile}</span> étoile
      </>
    );
  }

  if (audit) {
    return (
      <>
        {label}
        <span>{"Audit contrat d'objectif territorial (COT)"}</span>
      </>
    );
  }

  return null;
};

// donne les infos du cycle d'audit/labellisation associé à un sous-ensemble de preuves
const getCycleInfo = (preuves: TPreuveAuditEtLabellisation[]) => {
  const demande = preuves.find((p) => p.demande)?.demande || null;
  const audit = preuves?.find((p) => p.audit)?.audit || null;
  const d = audit?.date_fin || audit?.date_debut || demande?.date;
  const date = d ? new Date(d) : new Date();
  const annee = date.getFullYear();
  const status = getParcoursStatus({ demande, audit });
  const timestamp = date.getTime();

  const etoile = demande?.etoiles;
  return { timestamp, annee, audit, demande, etoile, status };
};
type TCycleInfo = ReturnType<typeof getCycleInfo>;

// ajoute les infos du cycle d'audit/labellisation associé à un sous-ensemble de preuves
const addInfoToEntry = (
  entry: [id: string, docs: TPreuveAuditEtLabellisation[]]
) => {
  const [id, docs] = entry;
  return {
    id,
    docs,
    info: getCycleInfo(docs),
  };
};
