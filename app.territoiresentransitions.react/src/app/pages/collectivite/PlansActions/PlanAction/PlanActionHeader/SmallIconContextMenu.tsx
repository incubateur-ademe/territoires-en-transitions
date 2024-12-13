import IconThreeDotHorizontal from '@/app/ui/icons/IconThreeDotHorizontal';
import { TOption } from '../../../../../../ui/shared/select/commons';
import ContextMenu from '../../../../../../ui/shared/select/ContextMenu';
import { MenuTriggerButton } from '../../../../../../ui/shared/select/MenuTriggerButton';

type TOptionWithIcon = TOption & { icon?: string };

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
      <MenuTriggerButton
        className={buttonClassname}
        data-test={dataTestButton}
        disabled={disabled}
        title={title}
      >
        {!hideDefaultIcon && (
          <IconThreeDotHorizontal className="w-5 h-5 fill-bf500" />
        )}
      </MenuTriggerButton>
    </ContextMenu>
  );
};

export default SmallIconContextMenu;
