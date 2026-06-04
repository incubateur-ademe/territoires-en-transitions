'use client';

import { makeCollectiviteDemarchePcaetDetailUrl } from '@/app/app/paths';
import {
  formatDemarcheStatut,
  listDemarchesPcaet,
} from '@/app/demarches/pcaet/demarche-pcaet.storage';
import type {
  DemarchePcaet,
  DemarchePcaetStatut,
} from '@/app/demarches/pcaet/demarche-pcaet.types';
import { appLabels } from '@/app/labels/catalog';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import type { ColorVariant } from '@tet/design-tokens';
import { Badge } from '@tet/ui';
import Link from 'next/link';
import { useMemo } from 'react';
import { DemarchePcaetSection } from './demarche-pcaet-section';

const STATUT_VARIANT: Record<DemarchePcaetStatut, ColorVariant> = {
  brouillon: 'grey',
  en_elaboration: 'info',
  pret_pour_depot: 'warning',
  soumis_ademe: 'warning',
  en_verification: 'warning',
  valide: 'success',
  publie: 'success',
};

type Props = {
  currentDemarcheId: string;
};

export const HistoriqueDemarchesSection = ({ currentDemarcheId }: Props) => {
  const { collectiviteId } = useCurrentCollectivite();

  const autres = useMemo(
    () =>
      listDemarchesPcaet(collectiviteId).filter(
        (d) => d.id !== currentDemarcheId
      ),
    [collectiviteId, currentDemarcheId]
  );

  if (autres.length === 0) return null;

  return (
    <DemarchePcaetSection title={appLabels.demarchePcaetHistoriqueTitre}>
      <ul className="flex flex-col gap-2">
        {autres.map((d: DemarchePcaet) => (
          <li key={d.id}>
            <Link
              href={makeCollectiviteDemarchePcaetDetailUrl({
                collectiviteId,
                demarchePcaetId: d.id,
              })}
              className="flex items-center justify-between gap-3 rounded-md border border-grey-3 bg-grey-1 px-3 py-2.5 hover:border-grey-4 hover:bg-white transition-colors"
              aria-label={appLabels.demarchePcaetHistoriqueVoirDemarche({
                titre: d.titre,
              })}
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-medium text-primary-9 truncate">
                  {d.titre}
                  {d.dateCreation
                    ? ` · ${new Date(d.dateCreation).getFullYear()}`
                    : ''}
                </span>
                <Badge
                  title={formatDemarcheStatut(d.statut)}
                  variant={STATUT_VARIANT[d.statut]}
                  size="xs"
                />
              </div>
              <span className="text-grey-5 shrink-0 text-sm">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </DemarchePcaetSection>
  );
};
