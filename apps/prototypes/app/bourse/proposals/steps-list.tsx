import { Badge } from '@tet/ui';
import { Etape } from '../fixtures';

/**
 * Proposition : nouveau composant
 * Besoin : une liste ordonnée d'étapes (pastille numérotée, titre, détail,
 * statut) ; le design system n'a ni liste d'étapes ni timeline.
 * Espacement hors échelle : 12px de padding vertical par ligne.
 */
export const StepsList = ({ etapes }: { etapes: ReadonlyArray<Etape> }) => (
  <ol className="flex flex-col font-normal">
    {etapes.map((etape) => (
      <li
        key={etape.numero}
        className="flex flex-wrap items-center gap-4 border-b border-grey-3 py-3"
      >
        <span
          aria-hidden="true"
          className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-2 text-xs font-bold text-primary-9"
        >
          {etape.numero}
        </span>
        <div className="flex min-w-60 flex-1 flex-col">
          <span className="text-sm font-medium text-primary-10">
            {etape.titre}
          </span>
          <span className="text-xs text-grey-8">{etape.detail}</span>
        </div>
        <Badge title={etape.statut} variant={etape.variante} size="sm" />
      </li>
    ))}
  </ol>
);
