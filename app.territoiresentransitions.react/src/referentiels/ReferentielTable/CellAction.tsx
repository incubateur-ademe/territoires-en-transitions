import { makeReferentielTacheUrl } from '@/app/app/paths';
import { Kbd } from '@/app/ui/shared/Kbd';
import { ReferentielId } from '@/domain/referentiels';
import { Tooltip } from '@/ui';
import Link from 'next/link';
import { CellProps } from 'react-table';
import { ActionReferentiel } from '../DEPRECATED_scores.types';

export type TCellProps = CellProps<ActionReferentiel> & {
  collectiviteId: number | null;
  referentielId: Exclude<ReferentielId, 'te' | 'te-test'> | null;
  maxDepth?: number | null;
  alwaysShowExpand?: boolean;
};

// décalage à gauche des lignes en fonction du niveau
const paddingByLevel: Record<
  Exclude<ReferentielId, 'te' | 'te-test'>,
  Record<number, number>
> = {
  cae: {
    1: 0,
    2: 16,
    // au dessus de 2 un décalage supplémentaire est appliqué par l'affichage de l'identifiant, il n'est donc pâs reporté ici
    3: 16,
    4: 32,
    5: 48,
  },
  eci: {
    1: 0,
    2: 16,
    3: 32,
    4: 48,
  },
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
    maxDepth,
    alwaysShowExpand,
  } = props;
  if (!collectiviteId || !referentielId) return null;

  const { depth, identifiant } = row.original;
  const haveSubrows = row.subRows.length > 0;
  const isNotMaxDepth = !maxDepth || depth < maxDepth;
  const showExpand = alwaysShowExpand || (haveSubrows && isNotMaxDepth);

  // applique un décalage en fonction du niveau + un décalage optionnel pour
  // compenser l'absence du bouton Expand lorsque c'est nécessaire
  const style = {
    paddingLeft:
      paddingByLevel[referentielId][depth] +
      (showExpand ? 0 : NO_EXPAND_OFFSET),
  };

  const pillDepths = referentielId === 'cae' ? [3, 4] : [2, 3];
  const idDepth = referentielId === 'cae' ? 2 : 1;

  if (!collectiviteId) {
    return null;
  }

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
                  actionId: row.original.action_id,
                  referentielId,
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
    Cliquer pour replier (tenir <Kbd>⇧ SHIFT</Kbd> enfoncé
    <br />
    pour replier toutes les lignes de même niveau)
  </p>
);
const infoDeplier = (
  <p className="font-normal">
    Cliquer pour déplier (tenir <Kbd>⇧ SHIFT</Kbd> enfoncé pour déplier
    <br />
    {"toutes les lignes de même niveau de l'axe, ou tenir"}
    <br />
    <Kbd>⌥ ALT</Kbd> enfoncé pour déplier aussi tous les axes)
  </p>
);

// affiche le picto reflétant l'état plié/déplié
const Expand = ({ row, referentielId }: TCellProps) => {
  const { isExpanded, original } = row;
  const { depth } = original;
  const invertColor = depth < (referentielId === 'cae' ? 3 : 2);
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
