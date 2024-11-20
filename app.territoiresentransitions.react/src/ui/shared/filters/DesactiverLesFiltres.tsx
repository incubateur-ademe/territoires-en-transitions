import { Icon } from '@tet/ui';
import classNames from 'classnames';

/** Bouton générique pour désactiver des filtres aux allures de DSFR */
export const DesactiverLesFiltres = (props: {
  onClick: () => void;
  className?: string;
}) => {
  return (
    <div
      className={classNames(
        'inline-block w-max border-b border-bf500',
        props.className
      )}
    >
      <button
        data-test="desactiver-les-filtres"
        onClick={props.onClick}
        className="flex items-center text-bf500 hover:!bg-transparent"
      >
        <Icon icon="close-circle-fill" className="mr-1" size="sm" />
        <span>Désactiver tous les filtres</span>
      </button>
    </div>
  );
};
