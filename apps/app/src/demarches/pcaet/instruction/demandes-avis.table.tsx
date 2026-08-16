'use client';

import { makeDemandeAvisDossierUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import type { RouterOutput } from '@tet/api';
import { PcaetDemandeAvisEtatEnum } from '@tet/domain/demarches';
import {
  Badge,
  Button,
  cn,
  Icon,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tooltip,
} from '@tet/ui';
import Link from 'next/link';
import {
  DEMANDE_AVIS_ETAT_LABELS,
  DEMANDE_AVIS_ETAT_VARIANTS,
} from './instruction.constants';

type Demande =
  RouterOutput['demarches']['pcaet']['listDemandesAvis']['items'][number];

const JOURS_URGENCE = 30;

const estUrgente = (avisDeadlineAt: string | null): boolean => {
  if (!avisDeadlineAt) return false;
  const restant = new Date(avisDeadlineAt).getTime() - Date.now();
  return restant < JOURS_URGENCE * 24 * 60 * 60 * 1000;
};

const EcheanceCell = ({ demande }: { demande: Demande }) => {
  if (!demande.avisDeadlineAt) {
    return <span className="text-grey-6">—</span>;
  }

  const urgente = estUrgente(demande.avisDeadlineAt);

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        urgente ? 'text-error-1 font-medium' : 'text-primary-9'
      )}
    >
      <Icon icon="calendar-line" size="sm" className="shrink-0" />
      <span>{getTextFormattedDate({ date: demande.avisDeadlineAt })}</span>
    </div>
  );
};

const ContactCell = ({ demande }: { demande: Demande }) => {
  const contact = demande.contacts[0];

  if (!contact) {
    return (
      <span className="text-grey-6" title={appLabels.instructionListeSansContact}>
        —
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-primary-9">{`${contact.prenom} ${contact.nom}`}</span>
      <a
        href={`mailto:${contact.email}`}
        className="text-primary-7 hover:underline truncate"
      >
        {contact.email}
      </a>
    </div>
  );
};

const ActionsCell = ({
  demande,
  collectiviteId,
}: {
  demande: Demande;
  collectiviteId: number;
}) => {
  const instructionOuverte =
    demande.etat === PcaetDemandeAvisEtatEnum.A_TRAITER ||
    demande.etat === PcaetDemandeAvisEtatEnum.BROUILLON_EN_COURS;

  return (
    <div className="flex items-center gap-2 justify-end">
      <Link
        href={makeDemandeAvisDossierUrl({
          collectiviteId,
          demandeAvisId: demande.demandeAvisId,
        })}
      >
        <Button
          variant="outlined"
          size="xs"
          icon={instructionOuverte ? 'draft-line' : 'eye-line'}
        >
          {instructionOuverte
            ? appLabels.instructionListeConsulter
            : appLabels.instructionListeVoirInstruction}
        </Button>
      </Link>
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

export const DemandesAvisTable = ({
  demandes,
  collectiviteId,
  onTrierParCollectivite,
  onTrierParContact,
  onTrierParStatut,
  onTrierParEcheance,
}: {
  demandes: Demande[];
  collectiviteId: number;
  onTrierParCollectivite: () => void;
  onTrierParContact: () => void;
  onTrierParStatut: () => void;
  onTrierParEcheance: () => void;
}) => (
  <Table aria-label={appLabels.instructionListeIntitule}>
    <TableHead>
      <TableRow>
        <TableHeaderCell
          title={appLabels.instructionListeColonneCollectivite}
          sortFn={onTrierParCollectivite}
        />
        <TableHeaderCell
          title={appLabels.instructionListeColonneContact}
          sortFn={onTrierParContact}
        />
        <TableHeaderCell
          title={appLabels.instructionListeColonneStatut}
          sortFn={onTrierParStatut}
        />
        <TableHeaderCell
          title={appLabels.instructionListeColonneEcheance}
          sortFn={onTrierParEcheance}
        />
        <TableHeaderCell
          title={appLabels.instructionListeColonneActions}
          className="text-right"
        />
      </TableRow>
    </TableHead>
    <tbody>
      {demandes.map((demande) => (
        <TableRow
          key={demande.demandeAvisId}
          data-test={`demarches.pcaet.instruction.demande-${demande.demandeAvisId}`}
        >
          <TableCell>
            <Link
              href={makeDemandeAvisDossierUrl({
                collectiviteId,
                demandeAvisId: demande.demandeAvisId,
              })}
              className="font-bold text-primary-9 hover:underline"
            >
              {demande.collectivite.nom}
            </Link>
          </TableCell>
          <TableCell>
            <ContactCell demande={demande} />
          </TableCell>
          <TableCell>
            <Badge
              title={DEMANDE_AVIS_ETAT_LABELS[demande.etat]}
              variant={DEMANDE_AVIS_ETAT_VARIANTS[demande.etat]}
              size="sm"
            />
          </TableCell>
          <TableCell>
            <EcheanceCell demande={demande} />
          </TableCell>
          <TableCell>
            <ActionsCell demande={demande} collectiviteId={collectiviteId} />
          </TableCell>
        </TableRow>
      ))}
    </tbody>
  </Table>
);
