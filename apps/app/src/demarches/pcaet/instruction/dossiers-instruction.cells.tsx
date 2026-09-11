'use client';

import { makeDossierInstructionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import type { RouterOutput } from '@tet/api';
import {
  DemarchePcaetObligationEnum,
  PcaetStatutInstructionEnum,
} from '@tet/domain/demarches';
import { Badge, Button, cn, Icon, Tooltip } from '@tet/ui';
import Link from 'next/link';

export type Dossier =
  RouterOutput['demarches']['pcaet']['listDossiersInstruction']['items'][number];

const JOURS_URGENCE = 30;

const estUrgente = (avisDeadlineAt: string | null): boolean => {
  if (!avisDeadlineAt) return false;
  const restant = new Date(avisDeadlineAt).getTime() - Date.now();
  return restant < JOURS_URGENCE * 24 * 60 * 60 * 1000;
};

/**
 * Le dossier ne s'ouvre qu'une fois transmis : c'est la transmission qui saisit
 * le service, et sans saisine il n'a rien à consulter. La ligne informe alors
 * sans conduire nulle part — de quoi relancer, pas de quoi lire un brouillon.
 */
const getDossierHref = (dossier: Dossier): string | null =>
  dossier.demandeAvisId === null
    ? null
    : makeDossierInstructionUrl({
        collectiviteInstruiteId: dossier.collectivite.id,
        demandeAvisId: dossier.demandeAvisId,
      });

export const DateCell = ({ date }: { date: string | null }) =>
  date ? (
    <span className="text-primary-9">{getTextFormattedDate({ date })}</span>
  ) : (
    <span className="text-grey-6">{'—'}</span>
  );

export const EcheanceCell = ({ dossier }: { dossier: Dossier }) => {
  if (!dossier.avisDeadlineAt) {
    return (
      <span className="text-grey-6">
        {appLabels.instructionListeSansEcheance}
      </span>
    );
  }

  const urgente = estUrgente(dossier.avisDeadlineAt);

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        urgente ? 'text-error-1 font-medium' : 'text-primary-9'
      )}
    >
      <Icon icon="calendar-line" size="sm" className="shrink-0" />
      <span>{getTextFormattedDate({ date: dossier.avisDeadlineAt })}</span>
    </div>
  );
};

/** Qui porte le PCAET dans la collectivité déposante, et comment le relancer. */
export const PiloteCell = ({ dossier }: { dossier: Dossier }) => {
  const pilote = dossier.contacts[0];

  if (!pilote) {
    return (
      <span
        className="text-grey-6"
        title={appLabels.instructionListeSansPilote}
      >
        {'—'}
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-primary-9">{`${pilote.prenom} ${pilote.nom}`}</span>
      <a
        href={`mailto:${pilote.email}`}
        className="text-primary-7 hover:underline truncate"
      >
        {pilote.email}
      </a>
    </div>
  );
};

/**
 * Obligatoire ou volontaire. Le badge est en `info` et non en `error` : une
 * exigence réglementaire n'est pas une anomalie.
 */
const ObligationBadge = ({ dossier }: { dossier: Dossier }) => {
  if (dossier.obligation === null) {
    return null;
  }

  const obligatoire =
    dossier.obligation === DemarchePcaetObligationEnum.OBLIGATOIRE;

  return (
    <Badge
      title={
        obligatoire
          ? appLabels.demarcheObligationObligatoire
          : appLabels.demarcheObligationVolontaire
      }
      variant={obligatoire ? 'info' : 'grey'}
      size="sm"
      uppercase={false}
    />
  );
};

export const ActionsCell = ({ dossier }: { dossier: Dossier }) => {
  const href = getDossierHref(dossier);

  if (href === null) {
    // Un dépôt encore en chantier n'a saisi personne ; un dépôt transmis sans
    // saisine pour ce service est un tout autre cas, et l'annoncer « non
    // transmis » serait faux — son échéance est là, sous les yeux de l'agent.
    const transmis =
      dossier.demarcheStatus !== null &&
      dossier.demarcheStatus !== 'en_elaboration';

    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-grey-6">
          {dossier.demarcheStatus === null
            ? null
            : transmis
            ? appLabels.instructionListeNonSaisi
            : appLabels.instructionListeNonTransmis}
        </span>
      </div>
    );
  }

  // Un dossier encore à instruire s'ouvre pour y travailler ; les autres se
  // consultent.
  const instructionOuverte =
    dossier.statut === PcaetStatutInstructionEnum.EN_INSTRUCTION;

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button
        href={href}
        variant="outlined"
        size="xs"
        icon={instructionOuverte ? 'draft-line' : 'eye-line'}
      >
        {instructionOuverte
          ? appLabels.instructionListeConsulter
          : appLabels.instructionListeVoirInstruction}
      </Button>
      <Tooltip label={appLabels.instructionListeTelechargerIndisponible}>
        <span tabIndex={0} className="inline-flex rounded outline-primary">
          <Button
            variant="outlined"
            size="xs"
            icon="download-line"
            disabled
            aria-label={appLabels.instructionListeTelecharger}
          />
        </span>
      </Tooltip>
    </div>
  );
};

export const CollectiviteCell = ({ dossier }: { dossier: Dossier }) => {
  const href = getDossierHref(dossier);
  const nom = (
    <span className="font-bold text-primary-9">{dossier.collectivite.nom}</span>
  );

  return (
    <div className="flex flex-col items-start gap-1">
      {href === null ? (
        nom
      ) : (
        <Link href={href} className="hover:underline">
          {nom}
        </Link>
      )}
      <ObligationBadge dossier={dossier} />
    </div>
  );
};

export const RegionCell = ({ dossier }: { dossier: Dossier }) => (
  <span className="text-primary-9">
    {dossier.collectivite.regionLibelle ?? '—'}
  </span>
);
