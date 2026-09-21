'use client';

import { appLabels } from '@/app/labels/catalog';
import { Checkbox, cn, TableHeaderCell, Tooltip } from '@tet/ui';
import { JSX } from 'react';
import { STICKY_LEFT_SHADOW_CLASSNAME } from './scroll-shadow';

type Props = {
  title: string;
  isApplicable: boolean;
  /** Absent quand la grille est consultable : la bascule disparaît alors. */
  onApplicableChange?: (isApplicable: boolean) => void;
  /**
   * Bascule en cours d'enregistrement : `isApplicable` vient encore du serveur,
   * un second clic renverrait la même valeur au lieu de l'annuler.
   */
  isApplicableChangePending?: boolean;
};

export const IndicateurTitleCell = ({
  title,
  isApplicable,
  onApplicableChange,
  isApplicableChangePending = false,
}: Props): JSX.Element => (
  <TableHeaderCell
    role="rowheader"
    pinnedLeft
    // Groupe *nommé* sur la cellule elle-même, pour que le survol de tout
    // son espace (y compris son padding) révèle la bascule. Le cadre de
    // défilement de la grille porte déjà un `group` (cf. `scroll-shadow.ts`),
    // et `group-hover:` matche n'importe quel ancêtre `.group` survolé —
    // survoler une ligne révélait donc la bascule de toutes les autres.
    // `group/indicateur` restreint le survol à la ligne elle-même, pour ne
    // pas encombrer une grille dont la plupart des lignes restent
    // applicables.
    className={cn(
      'group/indicateur border-b border-grey-3 align-middle',
      STICKY_LEFT_SHADOW_CLASSNAME
    )}
  >
    <div className="flex w-full items-center justify-between gap-2">
      <span className={cn(!isApplicable && 'text-grey-6 line-through')}>
        {title}
      </span>

      {onApplicableChange !== undefined && (
        <Tooltip
          label={appLabels.pcaetDiagnosticIndicateurNonApplicable}
          openingDelay={300}
        >
          {/*
            L'opacité doit porter sur ce wrapper et non sur `Checkbox` : ce
            dernier ne transmet sa `className` qu'à l'`<input>` du switch, pas
            à la coche (icône positionnée en absolu à côté), qui resterait
            donc visible même à `opacity-0`.
          */}
          <div
            className={cn(
              isApplicable &&
                'opacity-0 group-hover/indicateur:opacity-100 focus-within:opacity-100'
            )}
          >
            <Checkbox
              // `Checkbox` ne rend son `<label>` que si on lui passe un `label`,
              // et le `Tooltip` ne fournit qu'un `aria-describedby` tant qu'il est
              // ouvert : sans `aria-label`, l'interrupteur n'a pas de nom.
              aria-label={appLabels.pcaetDiagnosticIndicateurNonApplicable}
              data-test="indicateurs.grid.toggle-applicable"
              className={cn(isApplicable ? 'text-grey-7' : 'text-grey-8')}
              variant="switch"
              checked={isApplicable}
              disabled={isApplicableChangePending}
              onChange={() => onApplicableChange(!isApplicable)}
            />
          </div>
        </Tooltip>
      )}
    </div>
  </TableHeaderCell>
);
