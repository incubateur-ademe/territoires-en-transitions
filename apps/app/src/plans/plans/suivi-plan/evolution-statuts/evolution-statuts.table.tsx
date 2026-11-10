import { appLabels } from '@/app/labels/catalog';
import { SANS_STATUT_LABEL, Statut } from '@tet/domain/plans';
import { cn } from '@tet/ui/utils/cn';
import Link from 'next/link';
import { makePilotageParStatutUrl } from '../make-pilotage-par-statut-url';
import { COULEURS_SUIVI_BY_STATUT } from '../statut-suivi-colors';

export type EvolutionStatutRow = {
  statut: Statut | null;
  debut: number;
  fin: number;
};

const Nombre = ({
  value,
  isLoading,
}: {
  value: number | string;
  isLoading: boolean;
}) =>
  isLoading ? (
    <span className="inline-block w-6 h-4 align-middle rounded bg-grey-3 animate-pulse" />
  ) : (
    value
  );

const Evolution = ({
  evolution,
  isLoading,
}: {
  evolution: number;
  isLoading: boolean;
}) => (
  <span className={cn({ 'font-normal text-grey-6': evolution === 0 })}>
    <Nombre
      value={
        evolution === 0 ? '=' : evolution > 0 ? `+${evolution}` : `${evolution}`
      }
      isLoading={isLoading}
    />
  </span>
);

export const EvolutionStatutsTable = ({
  collectiviteId,
  planId,
  rows,
  totaux,
  libelles,
  isLoading,
}: {
  collectiviteId: number;
  planId: number;
  rows: EvolutionStatutRow[];
  totaux: [number, number];
  libelles: [string, string];
  isLoading: boolean;
}) => (
  <table
    className="w-full text-sm text-primary-9"
    data-test="plans.suivi.evolution-statuts.tableau"
  >
    <thead>
      <tr className="text-xs text-grey-8 border-b border-grey-3">
        <th className="py-2 font-normal text-left">
          {appLabels.evolutionStatutsStatut}
        </th>
        <th className="py-2 font-normal text-right">{libelles[0]}</th>
        <th className="py-2 font-normal text-right">{libelles[1]}</th>
        <th className="py-2 font-normal text-right">
          {appLabels.evolutionStatutsEvolution}
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map(({ statut, debut, fin }) => (
        <tr
          key={statut ?? SANS_STATUT_LABEL}
          className="border-b border-grey-3"
        >
          <td className="py-2">
            <Link
              href={makePilotageParStatutUrl({
                collectiviteId,
                planId,
                statut,
              })}
              className="flex items-center gap-2 text-primary-9 bg-none hover:underline"
              data-test="plans.suivi.evolution-statuts.lien-statut"
            >
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{
                  backgroundColor:
                    COULEURS_SUIVI_BY_STATUT[statut ?? SANS_STATUT_LABEL],
                }}
              />
              {statut ?? SANS_STATUT_LABEL}
            </Link>
          </td>
          <td className="py-2 text-right text-grey-8">
            <Nombre value={debut} isLoading={isLoading} />
          </td>
          <td className="py-2 text-right font-bold">
            <Nombre value={fin} isLoading={isLoading} />
          </td>
          <td className="py-2 text-right font-bold">
            <Evolution evolution={fin - debut} isLoading={isLoading} />
          </td>
        </tr>
      ))}
    </tbody>
    <tfoot>
      <tr className="font-bold border-t-2 border-grey-4">
        <td className="py-2">{appLabels.evolutionStatutsTotal}</td>
        <td className="py-2 text-right">
          <Nombre value={totaux[0]} isLoading={isLoading} />
        </td>
        <td className="py-2 text-right">
          <Nombre value={totaux[1]} isLoading={isLoading} />
        </td>
        <td className="py-2 text-right">
          <Evolution evolution={totaux[1] - totaux[0]} isLoading={isLoading} />
        </td>
      </tr>
    </tfoot>
  </table>
);
