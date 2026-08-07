'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import {
  DEMARCHE_PCAET_STATUT_VARIANTS,
  formatDemarcheStatut,
} from '@/app/demarches/pcaet/constants';
import { appLabels } from '@/app/labels/catalog';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Badge } from '@tet/ui';
import Link from 'next/link';
import { DemarcheSection } from './section';

type Props = {
  currentDemarcheId: number;
};

export const HistoriqueDemarchesSection = ({ currentDemarcheId }: Props) => {
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();

  const { data: demarches } = useQuery(
    trpc.demarches.pcaet.list.queryOptions({ collectiviteId })
  );

  const autres = (demarches ?? []).filter(
    (demarche) => demarche.id !== currentDemarcheId
  );

  if (autres.length === 0) return null;

  return (
    <DemarcheSection title={appLabels.demarcheHistoriqueTitre}>
      <ul className="flex flex-col gap-2">
        {autres.map((demarche) => (
          <li key={demarche.id}>
            <Link
              href={makeCollectiviteDemarchePcaetRootUrl({
                collectiviteId,
                demarcheId: demarche.id,
              })}
              className="flex items-center justify-between gap-3 rounded-md border border-grey-3 bg-grey-1 px-3 py-2.5 hover:border-grey-4 hover:bg-white transition-colors"
              aria-label={appLabels.demarcheHistoriqueVoirDemarche({
                titre: demarche.titre,
              })}
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-medium text-primary-9 truncate">
                  {demarche.titre}
                  {demarche.createdAt
                    ? ` · ${new Date(demarche.createdAt).getFullYear()}`
                    : ''}
                </span>
                <Badge
                  title={formatDemarcheStatut(demarche.status)}
                  variant={DEMARCHE_PCAET_STATUT_VARIANTS[demarche.status]}
                  size="xs"
                />
              </div>
              <span className="text-grey-5 shrink-0 text-sm">{`→`}</span>
            </Link>
          </li>
        ))}
      </ul>
    </DemarcheSection>
  );
};
