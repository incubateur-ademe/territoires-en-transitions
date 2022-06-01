import {CellProps} from 'react-table';
import {Link} from 'react-router-dom';
import {makeCollectiviteTacheUrl, ReferentielParamOption} from 'app/paths';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {ActionReferentiel} from './useReferentiel';

type TCellProps = CellProps<ActionReferentiel>;

/**
 * Affiche le nom d'une action, éventuellement précédé de l'identifiant et d'un
 * picto reflétant l'état plié/déplié lorsqu'il y a des descandants
 */
export const CellAction = (props: TCellProps) => {
  const {row, value} = props;
  const {depth, have_children, identifiant} = row.original;
  const style = {
    paddingLeft: (depth - 1) * (depth > 2 && have_children ? 8 : 24),
  };
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId() as ReferentielParamOption;

  return collectiviteId && referentielId ? (
    <>
      {depth > 2 ? <span className="identifiant">{identifiant}</span> : null}
      <span style={style}>
        {have_children ? <Expand {...props} /> : null}
        <span className={depth === 3 ? 'pill' : undefined}>
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
  return <span className={className} {...row.getToggleRowExpandedProps()} />;
};
