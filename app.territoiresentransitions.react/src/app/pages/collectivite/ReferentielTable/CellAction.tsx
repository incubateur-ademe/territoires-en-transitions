import {CellProps} from 'react-table';
import {Link} from 'react-router-dom';
import {makeCollectiviteTacheUrl, ReferentielParamOption} from 'app/paths';
import {ActionReferentiel} from './useReferentiel';

export type TCellProps = CellProps<ActionReferentiel> & {
  collectiviteId: number | null;
  referentielId: ReferentielParamOption | null;
  maxDepth?: number | null;
  alwaysShowExpand?: boolean;
};

// décalage à gauche des lignes en fonction du niveau
const paddingByLevel: Record<ReferentielParamOption, Record<number, number>> = {
  cae: {
    1: 0,
    2: 16,
    // au dessus de 2 un décalage supplémentaire est appliqué par l'affichage de l'identifiant, il n'est donc pâs reporté ici
    3: 16,
    4: 26,
    5: 36,
  },
  eci: {
    1: 0,
    2: 4,
    3: 16,
    4: 26,
    5: 36,
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

  const {depth, identifiant} = row.original;
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
                className="hover:underline"
                to={makeCollectiviteTacheUrl({
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
const infoReplier = `Cliquer pour replier (tenir SHIFT enfoncé pour replier toutes les lignes de même niveau)`;
const infoDeplier = `Cliquer pour déplier (tenir SHIFT enfoncé pour déplier toutes les lignes de même niveau de l'axe, ou tenir ALT enfoncé pour déplier aussi tous les axes)`;

// affiche le picto reflétant l'état plié/déplié
const Expand = ({row, referentielId}: TCellProps) => {
  const {isExpanded, original} = row;
  const {depth} = original;
  const invertColor = depth < (referentielId === 'cae' ? 3 : 2);
  const className = [
    'fr-mr-1w',
    isExpanded ? 'arrow-down' : 'arrow-right',
    invertColor ? 'before:bg-white' : 'before:bg-black',
  ].join(' ');

  const label = isExpanded ? infoReplier : infoDeplier;
  return (
    <button
      data-test={`btn-${isExpanded ? 'collapse' : 'expand'}`}
      className={className}
      {...row.getToggleRowExpandedProps()}
      title={label}
    />
  );
};
