import { appLabels } from '@/app/labels/catalog';
import { cn } from '@tet/ui/utils/cn';
import type { Entonnoir as EntonnoirData } from '../data/use-get-entonnoir';

type Flux = EntonnoirData['flux'][number];

const ORDRE_ETATS = [
  'mise_en_oeuvre',
  'definitif',
  'depot_pour_avis',
  'en_cours_elaboration',
  null,
];

const COULEUR_STATUT: Record<string, string> = {
  publie: 'bg-success-1',
  instruit: 'bg-info-1',
  en_elaboration: 'bg-warning-1',
};

const libelleArrivee = (f: Flux) =>
  f.statut
    ? appLabels.repriseTecStatutTet(f.statut)
    : appLabels.repriseTecEntonnoirNonReprisPour(
        appLabels.repriseTecMotifCourt(f.motif ?? '')
      );

const couleur = (f: Flux) =>
  f.statut ? COULEUR_STATUT[f.statut] ?? 'bg-success-1' : 'bg-grey-5';

export const Entonnoir = ({ entonnoir }: { entonnoir: EntonnoirData }) => {
  const max = Math.max(
    ...ORDRE_ETATS.map((etat) =>
      entonnoir.flux
        .filter((f) => f.etat === etat)
        .reduce((n, f) => n + f.nombre, 0)
    )
  );
  return (
    <div
      className="flex flex-col gap-5"
      data-test="admin.reprise-tec.entonnoir"
    >
      <p className="mb-0 text-lg font-bold text-primary-9">
        {appLabels.repriseTecEntonnoirTotal(entonnoir.total, entonnoir.repris)}
      </p>
      <div className="grid grid-cols-[12rem_1fr] items-start gap-x-4 gap-y-4">
        <span className="text-xs font-bold uppercase text-grey-8">
          {appLabels.repriseTecEntonnoirEtat}
        </span>
        <span className="text-xs font-bold uppercase text-grey-8">
          {appLabels.repriseTecEntonnoirArrivee}
        </span>
        {ORDRE_ETATS.map((etat) => {
          const flux = entonnoir.flux.filter((f) => f.etat === etat);
          const total = flux.reduce((n, f) => n + f.nombre, 0);
          if (total === 0) {
            return null;
          }
          return [
            <div key={`etat-${etat}`} className="flex flex-col">
              <span className="text-sm font-medium text-primary-10">
                {appLabels.repriseTecEtatTec(etat)}
              </span>
              <span className="text-xs text-grey-8">
                {appLabels.repriseTecNombreDossiers({ count: total })}
              </span>
            </div>,
            <div key={`flux-${etat}`} className="flex flex-col gap-1.5">
              <div
                className="flex h-6 overflow-hidden rounded"
                style={{ width: `${(total / max) * 100}%` }}
              >
                {flux.map((f) => (
                  <div
                    key={`${f.statut}-${f.motif}`}
                    className={cn('h-full border-r border-white', couleur(f))}
                    style={{ width: `${(f.nombre / total) * 100}%` }}
                    title={`${libelleArrivee(f)} : ${f.nombre}`}
                  />
                ))}
              </div>
              <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-grey-9">
                {flux.map((f) => (
                  <li
                    key={`${f.statut}-${f.motif}`}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={cn('h-2.5 w-2.5 rounded-sm', couleur(f))}
                    />
                    {libelleArrivee(f)}
                    <span className="font-bold">
                      {f.nombre.toLocaleString('fr-FR')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>,
          ];
        })}
      </div>
    </div>
  );
};
