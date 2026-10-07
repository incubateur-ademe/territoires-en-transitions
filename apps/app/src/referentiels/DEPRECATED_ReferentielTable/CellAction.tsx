import { makeReferentielTacheUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Kbd } from '@/app/ui/shared/Kbd';
import {
  ActionType,
  getActionLevelIndex,
  hasSousAxeLevel,
  ReferentielId,
} from '@tet/domain/referentiels';
import { Tooltip } from '@tet/ui';
import Link from 'next/link';
import { CellProps } from 'react-table';
import { ActionListItem } from '../actions/use-list-actions';
import { ActionDetailed } from '../use-snapshot';

export type TCellProps = CellProps<ActionListItem & ActionDetailed> & {
  collectiviteId: number | null;
  referentielId: ReferentielId | null;
  hierarchie?: ActionType[];
  maxDepth?: number | null;
  alwaysShowExpand?: boolean;
};

// décalage à gauche des lignes en fonction du niveau
const paddingAvecSousAxe: Record<number, number> = {
  1: 0,
  2: 16,
  // au dessus de 2 un décalage supplémentaire est appliqué par l'affichage de l'identifiant, il n'est donc pas reporté ici
  3: 16,
  4: 32,
  5: 48,
};

const paddingSansSousAxe: Record<number, number> = {
  1: 0,
  2: 16,
  3: 32,
  4: 48,
};

// décalage supplémentaire appliqué quand on n'affiche pas le bouton Expand
const NO_EXPAND_OFFSET = 34;

/**
 * Affiche le nom d'une action, éventuellement précédé de l'identifiant et d'un
 * picto reflétant l'état plié/déplié lorsqu'il y a des descandants
 */
export const CellAction = (props: TCellProps) => {
  const {
    row,
    value,
    collectiviteId,
    referentielId,
    hierarchie,
    maxDepth,
    alwaysShowExpand,
  } = props;
  if (!collectiviteId || !referentielId || !hierarchie?.length) return null;

  const { depth, identifiant } = row.original;
  const haveSubrows = row.subRows.length > 0;
  const isNotMaxDepth = !maxDepth || depth < maxDepth;
  const showExpand = alwaysShowExpand || (haveSubrows && isNotMaxDepth);

  // applique un décalage en fonction du niveau + un décalage optionnel pour
  // compenser l'absence du bouton Expand lorsque c'est nécessaire
  const padding = hasSousAxeLevel(hierarchie)
    ? paddingAvecSousAxe
    : paddingSansSousAxe;
  const style = {
    paddingLeft: padding[depth] + (showExpand ? 0 : NO_EXPAND_OFFSET),
  };

  const profondeurMesure = getActionLevelIndex(hierarchie);
  const pillDepths = [profondeurMesure, profondeurMesure + 1];
  const idDepth = profondeurMesure - 1;

  return (
    <>
      {depth > idDepth ? (
        <span className="identifiant">{identifiant}</span>
      ) : null}
      <span style={style}>
        {showExpand ? <Expand {...props} /> : null}
        <span
          className={
            pillDepths.includes(depth) && isNotMaxDepth ? 'pill' : undefined
          }
        >
          {depth > 0 ? (
            depth > idDepth ? (
              <Link
                className="bg-none hover:underline active:underline active:!bg-transparent"
                onClick={(evt) => evt.stopPropagation()}
                href={makeReferentielTacheUrl({
                  collectiviteId,
                  actionId: row.original.actionId,
                  referentielId,
                  hierarchie,
                })}
              >
                {value}
              </Link>
            ) : (
              value
            )
          ) : (
            `Référentiel ${value}`
          )}
        </span>
      </span>
    </>
  );
};

// infobulles
const infoReplier = (
  <p className="font-normal">
    {appLabels.tooltipReplierLignesDebut} <Kbd>{appLabels.toucheShift}</Kbd>{' '}
    {appLabels.tooltipMaintienEnfonce}
    <br />
    {appLabels.tooltipReplierLignesFin}
  </p>
);
const infoDeplier = (
  <p className="font-normal">
    {appLabels.tooltipDeplierLignesDebut} <Kbd>{appLabels.toucheShift}</Kbd>{' '}
    {appLabels.tooltipMaintienEnfoncePourDeplier}
    <br />
    {appLabels.tooltipDeplierMemeAxe}
    <br />
    <Kbd>{appLabels.toucheAlt}</Kbd> {appLabels.tooltipDeplierTousAxes}
  </p>
);

// affiche le picto reflétant l'état plié/déplié
const Expand = ({ row, hierarchie }: TCellProps) => {
  const { isExpanded, original } = row;
  const { level: depth } = original;
  const invertColor = Boolean(
    hierarchie?.length && depth < getActionLevelIndex(hierarchie)
  );
  const className = [
    'mr-2 hover:!bg-transparent',
    isExpanded ? 'arrow-down' : 'arrow-right',
    invertColor ? 'before:bg-white' : 'before:bg-black',
  ].join(' ');

  const label = isExpanded ? infoReplier : infoDeplier;
  return (
    <Tooltip label={label}>
      <button
        data-test={`btn-${isExpanded ? 'collapse' : 'expand'}`}
        className={className}
        {...row.getToggleRowExpandedProps()}
        onMouseOver={undefined}
        title=""
        onClick={(evt) => {
          evt.stopPropagation();
          row.toggleRowExpanded();
        }}
      />
    </Tooltip>
  );
};
