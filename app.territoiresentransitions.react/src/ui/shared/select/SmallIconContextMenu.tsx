import classNames from 'classnames';
import IconThreeDotHorizontal from 'ui/icons/IconThreeDotHorizontal';
import {TOption} from './commons';
import ContextMenu from './ContextMenu';

type TOptionWithIcon = TOption & {icon?: string};

/** Affiche un bouton avec une petite icone permettant d'ouvrir un menu déroulant */
const SmallIconContextMenu = ({
  /** id du menu déroulant pour les tests */
  dataTest,
  /** id du bouton d'ouverture du menu déroulant pour les tests */
  dataTestButton,
  /** options du menu */
  options,
  /** styles complémentaires pour le bouton */
  buttonClassname,
  /** titre du bouton */
  title,
  /** pour désactiver le bouton */
  disabled,
  /** désactive l'icone par défaut `...` (passer à la place une classe css fr-icon-) */
  hideDefaultIcon,
  /** appelée lorsqu'une option est sélectionnée */
  onSelect,
}: {
  dataTest?: string;
  dataTestButton?: string;
  options: TOptionWithIcon[];
  buttonClassname?: string;
  hideDefaultIcon?: boolean;
  title?: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
}) => {
  return (
    <ContextMenu dataTest={dataTest} options={options} onSelect={onSelect}>
      <button
        data-test={dataTestButton}
        className={classNames(
          'border border-solid border-gray-200 p-1 text-bf500 h-8 w-8',
          buttonClassname
        )}
        title={title}
        disabled={disabled}
      >
        {!hideDefaultIcon && (
          <IconThreeDotHorizontal className="w-5 h-5 fill-bf500" />
        )}
      </button>
    </ContextMenu>
  );
};

export default SmallIconContextMenu;
