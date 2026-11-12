'use client';

import {
  makeDemarcheInstructionUrl,
  makeDossierInstructionUrl,
} from '@/app/app/paths';
import { BasculerGroupeButton } from '@/app/demarches/components/basculer-groupe.button';
import { appLabels } from '@/app/labels/catalog';
import { format } from 'date-fns';
import type { RouterOutput } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  DemarchePcaetStatusEnum,
  PcaetStatutInstructionEnum,
} from '@tet/domain/demarches';
import { Badge, Button, ButtonMenu, cn, Icon } from '@tet/ui';
import Link from 'next/link';
import { useState } from 'react';
import { getEcheanceAvis } from '../../echeance-avis';
import {
  ECHEANCE_AVIS_COULEURS,
  EcheanceAvisInfo,
  EcheanceAvisMention,
} from '../../echeance-avis.view';
import { DateSaisinePanel } from './date-saisine.panel';
import {
  OBLIGATION_LABELS,
  OBLIGATION_VARIANTS,
} from './instruction.constants';

export type Dossier =
  RouterOutput['demarches']['pcaet']['listDossiersInstruction']['items'][number];

const formatDateNumerique = (date: string): string =>
  format(new Date(date), 'dd/MM/yyyy');

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
    <span className="text-primary-9">{formatDateNumerique(date)}</span>
  ) : (
    <span className="text-grey-6">{'—'}</span>
  );

export const DateSaisineCell = ({ dossier }: { dossier: Dossier }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const { demandeAvisId } = dossier;

  if (
    demandeAvisId === null ||
    !dossier.peutModifierDateSaisine ||
    !hasCollectivitePermission('demarches.pcaet.mutate')
  ) {
    return <DateCell date={dossier.dateSaisine} />;
  }

  const menu = {
    placement: 'bottom-start' as const,
    className: 'max-w-none w-80',
    openState: { isOpen, setIsOpen },
    startContent: (
      <DateSaisinePanel
        demandeAvisId={demandeAvisId}
        dateSaisine={dossier.dateSaisine}
        onSaved={() => setIsOpen(false)}
      />
    ),
  };

  const texte = dossier.dateSaisine
    ? formatDateNumerique(dossier.dateSaisine)
    : appLabels.instructionDateSaisineVide;
  const action = dossier.dateSaisine
    ? appLabels.instructionDateSaisineModifierAria
    : appLabels.instructionDateSaisineRenseignerAria;

  return (
    <ButtonMenu
      variant="unstyled"
      size="xs"
      className="-mx-1 flex items-center gap-1 rounded px-1 py-0.5 text-primary-8 hover:bg-primary-1"
      icon="edit-line"
      iconPosition="right"
      title={action}
      aria-label={`${texte}, ${action}`}
      data-test="demarches.pcaet.instruction.date-saisine-modifier"
      menu={menu}
    >
      <span className={dossier.dateSaisine ? 'text-primary-9' : 'text-grey-6'}>
        {texte}
      </span>
    </ButtonMenu>
  );
};

export const EcheanceCell = ({ dossier }: { dossier: Dossier }) => {
  const [nowMs] = useState(() => Date.now());

  if (!dossier.avisDeadlineAt || !dossier.transmittedAt) {
    return (
      <span className="text-grey-6">
        {appLabels.instructionListeSansEcheance}
      </span>
    );
  }

  const echeance = getEcheanceAvis({
    transmittedAt: dossier.transmittedAt,
    avisDeadlineAt: dossier.avisDeadlineAt,
    avisAttendu:
      dossier.deposeAvis &&
      dossier.statut === PcaetStatutInstructionEnum.EN_INSTRUCTION,
    nowMs,
  });

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'flex items-center gap-2',
          ECHEANCE_AVIS_COULEURS[echeance.phase],
          (echeance.phase === 'proche' || echeance.phase === 'hors_delai') &&
            'font-medium'
        )}
      >
        <Icon icon="calendar-line" size="sm" className="shrink-0" />
        <span>{format(echeance.date, 'dd/MM/yyyy')}</span>
        <EcheanceAvisInfo echeance={echeance} />
      </div>
      <EcheanceAvisMention echeance={echeance} className="text-xs" />
    </div>
  );
};

/** Les pilotes désignés sur la démarche, et comment les joindre. */
export const PiloteCell = ({ dossier }: { dossier: Dossier }) => {
  if (dossier.pilotes.length === 0) {
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
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {dossier.pilotes.map((pilote, index) => (
        <li key={`${pilote.nom}-${index}`} className="flex flex-col p-0">
          <span className="text-primary-9">{pilote.nom}</span>
          {pilote.email && (
            <a
              href={`mailto:${pilote.email}`}
              className="text-primary-7 hover:underline truncate"
            >
              {pilote.email}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
};

const ObligationBadge = ({ dossier }: { dossier: Dossier }) => {
  if (dossier.obligation === null) {
    return null;
  }

  return (
    <Badge
      title={OBLIGATION_LABELS[dossier.obligation]}
      variant={OBLIGATION_VARIANTS[dossier.obligation]}
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
  // consultent. Avant l'adoption, on lit un projet ; après, le PCAET lui-même.
  const instructionOuverte =
    dossier.statut === PcaetStatutInstructionEnum.EN_INSTRUCTION;
  const pcaetAdopte =
    dossier.statut === PcaetStatutInstructionEnum.ADOPTE ||
    dossier.statut === PcaetStatutInstructionEnum.ARCHIVE;

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button
        href={href}
        variant="outlined"
        size="xs"
        icon={instructionOuverte ? 'draft-line' : 'eye-line'}
      >
        {pcaetAdopte
          ? appLabels.instructionListeVoirPcaet
          : appLabels.instructionListeConsulterProjet}
      </Button>
    </div>
  );
};

export const CollectiviteCell = ({
  dossier,
  deplie,
  basculer,
}: {
  dossier: Dossier;
  /** Les EPCI couverts sont-ils affichés ? Sans objet hors Supra. */
  deplie?: boolean;
  basculer?: () => void;
}) => {
  const href = getDossierHref(dossier);
  const nom = (
    <span className="font-bold text-primary-9">{dossier.collectivite.nom}</span>
  );
  const groupe = dossier.collectivitesCouvertes.length > 0 && basculer;

  return (
    <div className="flex items-start gap-1">
      {groupe && (
        <BasculerGroupeButton
          deplie={deplie ?? true}
          onClick={basculer}
          ariaLabel={
            deplie
              ? appLabels.instructionListeReplierGroupe({
                  porteur: dossier.collectivite.nom,
                })
              : appLabels.instructionListeDeplierGroupe({
                  porteur: dossier.collectivite.nom,
                })
          }
          dataTest="demarches.pcaet.instruction.basculer-groupe"
        />
      )}
      <div className="flex flex-col items-start gap-1">
        {href === null ? (
          nom
        ) : (
          <Link href={href} className="hover:underline">
            {nom}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-1">
          {dossier.typePorteurSupra !== null && (
            <Badge
              title={appLabels.instructionListeBadgeSupra}
              variant="new"
              size="sm"
              uppercase={false}
            />
          )}
          <ObligationBadge dossier={dossier} />
          <ScotAecBadge dossier={dossier} />
        </div>
      </div>
    </div>
  );
};

type CollectiviteCouverte = Dossier['collectivitesCouvertes'][number];

/**
 * Un EPCI que couvre le dépôt d'un Supra, en sous-ligne de son porteur : son
 * nom, son obligation propre et qui le porte. Ni statut, ni dates, ni action —
 * ce sont ceux du dépôt, sur la ligne du porteur.
 */
export const CollectiviteCouverteCell = ({
  couverte,
  typePorteurSupra,
}: {
  couverte: CollectiviteCouverte;
  typePorteurSupra: Dossier['typePorteurSupra'];
}) => (
  <div className="flex flex-col items-start gap-1 pl-6">
    <span className="text-primary-9">{couverte.nom}</span>
    <div className="flex flex-wrap items-center gap-1">
      {couverte.obligation !== null && (
        <Badge
          title={OBLIGATION_LABELS[couverte.obligation]}
          variant={OBLIGATION_VARIANTS[couverte.obligation]}
          size="sm"
          uppercase={false}
        />
      )}
      <Badge
        title={
          typePorteurSupra
            ? appLabels.demarchePorteParType[typePorteurSupra]
            : appLabels.demarchePorteParAutreStructure
        }
        variant="grey"
        type="outlined"
        size="sm"
        uppercase={false}
        trim={false}
      />
    </div>
  </div>
);

export const RegionCell = ({ dossier }: { dossier: Dossier }) => (
  <span className="text-primary-9">
    {dossier.collectivite.regionLibelle ?? '—'}
  </span>
);

/** Le numéro, le nom au survol : la colonne est étroite. */
export const DepartementCell = ({
  departement,
}: {
  departement: { code: string | null; libelle: string | null };
}) =>
  departement.code === null ? (
    <span className="text-grey-6">{'—'}</span>
  ) : (
    <span className="text-primary-9" title={departement.libelle ?? undefined}>
      {departement.code}
    </span>
  );
