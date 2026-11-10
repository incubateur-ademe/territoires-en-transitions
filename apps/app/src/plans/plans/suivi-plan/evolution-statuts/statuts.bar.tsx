import FicheStatutBadge from '@/app/plans/fiches/show-fiche/components/fiche-statut.badge';
import { SANS_STATUT_LABEL, Statut } from '@tet/domain/plans';
import { cn, Tooltip } from '@tet/ui';
import Link from 'next/link';
import { COULEURS_SUIVI_BY_STATUT } from '../statut-suivi-colors';

const PART_MIN_AVEC_LIBELLE = 0.05;

export const StatutsBar = ({
  titre,
  legende,
  total,
  statuts,
  isLoading,
  getHref,
  dataTest,
}: {
  titre: string;
  legende: string;
  total: number;
  statuts: { statut: Statut | null; count: number }[];
  isLoading: boolean;
  getHref?: (statut: Statut | null) => string;
  dataTest?: string;
}) => (
  <div className="flex flex-col gap-2" data-test={dataTest}>
    <span className="text-sm font-medium text-primary-9">{titre}</span>
    {isLoading ? (
      <>
        <div className="w-full h-7 rounded-md bg-grey-3 animate-pulse" />
        <div className="w-56 h-4 rounded bg-grey-3 animate-pulse" />
      </>
    ) : (
      <>
        <div className="flex w-full h-7 rounded-md overflow-hidden bg-grey-2">
          {statuts
            .filter(({ count }) => count > 0)
            .map(({ statut, count }) => {
              const libelle = statut ?? SANS_STATUT_LABEL;
              const segmentProps = {
                className: cn(
                  'flex items-center justify-center h-full text-xs font-bold text-white',
                  getHref && 'bg-none hover:opacity-80'
                ),
                style: {
                  width: `${(count / total) * 100}%`,
                  backgroundColor: COULEURS_SUIVI_BY_STATUT[libelle],
                },
                children: count / total >= PART_MIN_AVEC_LIBELLE ? count : null,
              };
              return (
                <Tooltip
                  key={libelle}
                  openingDelay={0}
                  label={<FicheStatutBadge statut={statut} count={count} />}
                >
                  {getHref ? (
                    <Link
                      href={getHref(statut)}
                      data-test="plans.suivi.evolution-statuts.segment-statut"
                      {...segmentProps}
                    />
                  ) : (
                    <span {...segmentProps} />
                  )}
                </Tooltip>
              );
            })}
        </div>
        <span className="text-xs text-grey-8">{legende}</span>
      </>
    )}
  </div>
);
