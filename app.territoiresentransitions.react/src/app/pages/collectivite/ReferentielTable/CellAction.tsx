import {CellProps} from 'react-table';
import {Link} from 'react-router-dom';
import {makeCollectiviteTacheUrl, ReferentielParamOption} from 'app/paths';
import {ActionReferentiel} from './useReferentiel';

export type TCellProps = CellProps<ActionReferentiel> & {
  collectiviteId: number | null;
  referentielId: ReferentielParamOption | null;
  maxDepth?: number | null;
};

// décalage à gauche des lignes en fonction du niveau
const paddingByLevel: Record<number, number> = {
  1: 0,
  2: 16,
  // au dessus de 2 un décalage supplémentaire est appliqué par l'affichage de l'identifiant, il n'est donc pâs reporté ici
  3: 16,
  4: 26,
  5: 36,
};

// décalage supplémentaire appliqué quand on n'affiche pas le bouton Expand
const NO_EXPAND_OFFSET = 34;

/**
 * Affiche le nom d'une action, éventuellement précédé de l'identifiant et d'un
 * picto reflétant l'état plié/déplié lorsqu'il y a des descandants
 */
export const CellAction = (props: TCellProps) => {
  const {row, value, collectiviteId, referentielId, maxDepth} = props;
  const {depth, identifiant} = row.original;
  const haveSubrows = row.subRows.length > 0;
  const isNotMaxDepth = !maxDepth || depth < maxDepth;
  const showExpand = haveSubrows && isNotMaxDepth;

  // applique un décalage en fonction du niveau + un décalage optionnel pour
  // compenser l'absence du bouton Expand lorsque c'est nécessaire
  const style = {
    paddingLeft: paddingByLevel[depth] + (showExpand ? 0 : NO_EXPAND_OFFSET),
  };

  return collectiviteId && referentielId ? (
    <>
      {depth > 2 ? <span className="identifiant">{identifiant}</span> : null}
      <span style={style}>
        {showExpand ? <Expand {...props} /> : null}
        <span className={depth === 3 && isNotMaxDepth ? 'pill' : undefined}>
          {depth > 0 ? (
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
            `Référentiel ${value}`
          )}
        </span>
      </span>
    </>
  ) : null;
};

// affiche le picto reflétant l'état plié/déplié
const Expand = ({row}: TCellProps) => {
  const {isExpanded, original} = row;
  const {depth} = original;
  const className = [
    'fr-mr-1w',
    isExpanded ? 'arrow-down' : 'arrow-right',
    depth < 3 ? 'before:bg-white' : 'before:bg-black',
  ].join(' ');
  return <button className={className} {...row.getToggleRowExpandedProps()} />;
};
