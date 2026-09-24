'use client';

import {
  makeDemarcheInstructionUrl,
  makeDossierInstructionUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import type { RouterOutput } from '@tet/api';
import {
  DemarchePcaetObligationEnum,
  DemarchePcaetStatusEnum,
  PcaetStatutInstructionEnum,
} from '@tet/domain/demarches';
import { Badge, Button, cn, Icon } from '@tet/ui';
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
 * Deux portes vers le dossier. La saisine, une fois le dépôt transmis : c'est
 * elle qui ouvre le dossier. La démarche, tant qu'il est en élaboration : le
 * service qui couvre la collectivité le lit déjà, tel qu'il est, pour suivre
 * l'avancement d'un dépôt qu'il instruira.
 *
 * Un dépôt transmis sans saisine pour ce service, lui, ne s'ouvre pas : la
 * transmission a désigné d'autres destinataires, et la ligne informe sans
 * conduire nulle part.
 */
const getDossierHref = (dossier: Dossier): string | null => {
  if (dossier.demandeAvisId !== null) {
    return makeDossierInstructionUrl({
      collectiviteInstruiteId: dossier.collectivite.id,
      demandeAvisId: dossier.demandeAvisId,
    });
  }
  if (
    dossier.demarcheId !== null &&
    dossier.demarcheStatus === DemarchePcaetStatusEnum.EN_ELABORATION
  ) {
    return makeDemarcheInstructionUrl({
      collectiviteInstruiteId: dossier.collectivite.id,
      demarcheId: dossier.demarcheId,
    });
  }
  return null;
};

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

/**
 * Un dossier qui ne se lit pas comme un PCAET classique : le document déposé
 * vaut à la fois SCoT et PCAET. Déclaré par la collectivité, jamais déduit.
 */
const ScotAecBadge = ({ dossier }: { dossier: Dossier }) => {
  if (!dossier.isScotAec) {
    return null;
  }

  return (
    <Badge
      title={appLabels.demarcheScotAecBadge}
      variant="info"
      size="sm"
      uppercase={false}
    />
  );
};

export const ActionsCell = ({ dossier }: { dossier: Dossier }) => {
  const href = getDossierHref(dossier);

  if (href === null) {
    // Sans lien, il ne reste que le dépôt transmis sans saisine pour ce
    // service : la transmission a désigné d'autres destinataires, et
    // l'annoncer « non transmis » serait faux — son échéance est là, sous les
    // yeux de l'agent. Une collectivité sans dépôt n'a rien à dire ici.
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-grey-6">
          {dossier.demarcheStatus === null
            ? null
            : appLabels.instructionListeNonSaisi}
        </span>
      </div>
    );
  }

  // Un dossier encore à instruire s'ouvre pour y travailler ; les autres se
  // consultent. Un dépôt en élaboration se consulte aussi, mais il n'y a pas
  // d'instruction à voir : c'est le PCAET lui-même qu'on lit.
  const instructionOuverte =
    dossier.statut === PcaetStatutInstructionEnum.EN_INSTRUCTION;
  const enElaboration =
    dossier.statut === PcaetStatutInstructionEnum.EN_ELABORATION;

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button
        href={href}
        variant="outlined"
        size="xs"
        icon={instructionOuverte ? 'draft-line' : 'eye-line'}
      >
        {instructionOuverte || enElaboration
          ? appLabels.instructionListeConsulter
          : appLabels.instructionListeVoirInstruction}
      </Button>
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
      <div className="flex flex-wrap items-center gap-1">
        <ObligationBadge dossier={dossier} />
        <ScotAecBadge dossier={dossier} />
      </div>
    </div>
  );
};

export const RegionCell = ({ dossier }: { dossier: Dossier }) => (
  <span className="text-primary-9">
    {dossier.collectivite.regionLibelle ?? '—'}
  </span>
);
