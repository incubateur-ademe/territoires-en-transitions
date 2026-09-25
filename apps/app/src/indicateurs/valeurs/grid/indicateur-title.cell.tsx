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
};

export const IndicateurTitleCell = ({
  title,
  isApplicable,
  onApplicableChange,
}: Props): JSX.Element => {
  /**
   * Le nom de la bascule porte le titre de l'indicateur — toutes les lignes en
   * ont une, il faut pouvoir les distinguer — mais pas son état : la coche le
   * dit déjà, et un nom qui suivrait l'état serait annoncé deux fois puis
   * réécrit à l'activation. L'infobulle, elle, annonce l'action.
   */
  const basculeLabel = appLabels.pcaetDiagnosticIndicateurApplicabiliteBascule({
    titre: title,
  });
  const basculeAction = isApplicable
    ? appLabels.pcaetDiagnosticIndicateurMarquerNonApplicable
    : appLabels.pcaetDiagnosticIndicateurMarquerApplicable;

  return (
    <TableHeaderCell
      role="rowheader"
      pinnedLeft
      // Groupe *nommé* : le cadre de défilement de la grille porte déjà un
      // `group` (cf. `scroll-shadow.ts`), et `group-hover:` matche n'importe
      // quel ancêtre `.group` survolé — survoler une ligne ranimerait donc la
      // bascule de toutes les autres. Le nom restreint le survol à la ligne.
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
          <Tooltip label={basculeAction} openingDelay={300}>
            {/*
              La `className` d'un interrupteur habille le conteneur de
              l'`<input>` et de sa coche (cf. `input-switch.tsx`) : l'opacité
              couvre donc bien tout l'interrupteur. Une bascule applicable — le
              cas courant — reste en retrait tant qu'on ne survole pas sa ligne,
              pour ne pas encombrer la grille.

              Le retrait s'arrête à `opacity-80` : le rail coché est `bg-primary`
              (#6A6AF4) sur cellule blanche, soit 3,05:1 une fois fondu — le
              plancher de 3:1 qu'un contrôle doit tenir (WCAG 1.4.11). Plus
              transparent, il tombe à 1,9:1, et personne ne le rattrape au
              survol sur écran tactile.
            */}
            <Checkbox
              // `Checkbox` ne rend son `<label>` que si on lui passe un `label`,
              // et le `Tooltip` ne fournit qu'un `aria-describedby` tant qu'il est
              // ouvert : sans `aria-label`, l'interrupteur n'a pas de nom.
              aria-label={basculeLabel}
              data-test="indicateurs.grid.toggle-applicable"
              className={cn(
                'transition-opacity',
                isApplicable
                  ? 'text-grey-7 opacity-80 focus-within:opacity-100 group-hover/indicateur:opacity-100'
                  : 'text-grey-8'
              )}
              variant="switch"
              checked={isApplicable}
              onChange={() => onApplicableChange(!isApplicable)}
            />
          </Tooltip>
        )}
      </div>
    </TableHeaderCell>
  );
};
