'use client';

import { makeCollectiviteDemarchePcaetDetailUrl } from '@/app/app/paths';
import { listDemarchesPcaet } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import {
  Button,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tet/ui';
import { JSX } from 'react';
import { canDeposerAvis, drealCollectivites } from '../vue-dreal.mock';
import { DrealContactCell } from './dreal-contact-cell';
import { DREAL_INSTRUCTEUR_PARAM } from './dreal-context-banner';
import { DrealStatutBadge } from './dreal-statut-badge';

/**
 * Tableau des collectivités (EPCI) suivies par la DREAL.
 * « Consulter » ouvre la vue dossier PCAET existante avec un bandeau de
 * contexte instructeur (`?instructeur=1`) — pas une vue dédiée.
 * « Déposer un avis » n'est actif que si le dépôt est « Transmis pour avis ».
 */
export const DrealCollectivitesTable = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): JSX.Element => {
  // Proto : toutes les lignes pointent vers le dossier PCAET existant de la
  // collectivité courante (les EPCI mockés n'ont pas de dossier réel).
  const demarche = listDemarchesPcaet(collectiviteId)[0];
  const consulterHref = demarche
    ? `${makeCollectiviteDemarchePcaetDetailUrl({
        collectiviteId,
        demarchePcaetId: demarche.id,
      })}?${DREAL_INSTRUCTEUR_PARAM}=1`
    : undefined;

  return (
    <div className="max-xl:overflow-x-auto bg-white rounded-xl border border-grey-3">
      <Table>
        <colgroup>
          <col />
          <col className="w-56" />
          <col className="w-52" />
          <col className="w-44" />
          <col className="w-[420px]" />
        </colgroup>
        <TableHead>
          <tr>
            <TableHeaderCell title="Collectivité" pinnedLeft />
            <TableHeaderCell title="Contact" />
            <TableHeaderCell title="Statut du dépôt" />
            <TableHeaderCell title="Échéance avis" />
            <TableHeaderCell title="Actions" className="text-right" />
          </tr>
        </TableHead>
        <tbody>
          {drealCollectivites.map((collectivite) => {
            const avisActif = canDeposerAvis(collectivite.statut);
            return (
              <TableRow key={collectivite.id}>
                <TableCell pinnedLeft>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary-10">
                      {collectivite.nom}
                    </span>
                    <span className="text-xs text-grey-7">
                      {collectivite.population}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <DrealContactCell
                    nom={collectivite.contactNom}
                    email={collectivite.contactEmail}
                  />
                </TableCell>

                <TableCell>
                  <DrealStatutBadge statut={collectivite.statut} />
                </TableCell>

                <TableCell>
                  {collectivite.echeanceAvis ? (
                    <span className="text-sm text-primary-9">
                      Avis attendu avant le {collectivite.echeanceAvis}
                    </span>
                  ) : (
                    <span className="text-sm text-grey-6">—</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
                    {consulterHref ? (
                      <Button
                        variant="outlined"
                        size="xs"
                        icon="eye-line"
                        href={consulterHref}
                      >
                        Consulter
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="xs"
                        icon="eye-line"
                        disabled
                      >
                        Consulter
                      </Button>
                    )}
                    <Button variant="grey" size="xs" icon="download-2-line">
                      Télécharger
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      icon="quill-pen-line"
                      disabled={!avisActif}
                    >
                      Déposer un avis
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};
