import { appLabels } from '@/app/labels/catalog';
import { Badge } from '@tet/ui';

export type DateDatee = {
  libelle: string;
  date: string | null;
  source: 'tec' | 'suivi' | 'tet';
};

const VARIANTE = { tec: 'default', suivi: 'info', tet: 'success' } as const;
const SOURCE = {
  tec: appLabels.repriseTecSourceTec,
  suivi: appLabels.repriseTecSourceSuivi,
  tet: appLabels.repriseTecSourceTet,
};

export const FriseDates = ({ dates }: { dates: DateDatee[] }) => {
  const liste = dates
    .flatMap((d) => (d.date ? [{ ...d, date: d.date.slice(0, 10) }] : []))
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <ol className="mb-0 flex flex-wrap gap-x-6 gap-y-3 border-l-2 border-primary-3 pl-4 md:border-l-0 md:border-t-2 md:pl-0 md:pt-3">
      {liste.map((d) => (
        <li
          key={`${d.libelle}-${d.source}`}
          className="flex min-w-[8rem] flex-col gap-1"
        >
          <span className="text-sm font-bold tabular-nums text-primary-9">
            {new Date(d.date).toLocaleDateString('fr-FR')}
          </span>
          <span className="text-xs text-grey-8">{d.libelle}</span>
          <Badge
            size="xs"
            variant={VARIANTE[d.source]}
            title={SOURCE[d.source]}
          />
        </li>
      ))}
    </ol>
  );
};
