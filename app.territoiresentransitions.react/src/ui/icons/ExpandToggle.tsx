import classNames from 'classnames';

/** Icône reflétant un état ouvert/fermé */
export const ExpandToggle = ({open}: {open: boolean}) => (
  <span
    className={classNames('text-bf500', {
      'fr-icon-arrow-down-s-fill': open,
      'fr-icon-arrow-right-s-fill': !open,
    })}
  />
);
