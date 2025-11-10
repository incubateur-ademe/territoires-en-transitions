import { useState } from 'react';
import { Icon } from '../Icon';
import {
  DEPRECATED_ButtonMenu,
  DEPRECATED_ButtonMenuProps,
} from './DEPRECATED_ButtonMenu';

export type MenuAction = {
  icon?: string;
  label: string;
  onClick: () => void | boolean; // return true to keep the menu opened
};

type ButtonMenuProps = Pick<
  DEPRECATED_ButtonMenuProps,
  | 'icon'
  | 'size'
  | 'variant'
  | 'menuPlacement'
  | 'text'
  | 'iconPosition'
  | 'openState'
> & {
  actions: MenuAction[];
};

export const ButtonMenu = ({
  actions,
  openState,
  icon = 'more-line',
  size = 'xs',
  variant = 'grey',
  ...props
}: ButtonMenuProps) => {
  const isControlled = !!openState;
  const [open, setOpen] = useState(false);
  const isOpen = isControlled ? openState.isOpen : open;

  const handleOpenChange = () => {
    if (isControlled) {
      openState.setIsOpen(!openState.isOpen);
    } else {
      setOpen(!open);
    }
  };

  return (
    <DEPRECATED_ButtonMenu
      icon={icon}
      size={size}
      variant={variant}
      openState={
        isControlled
          ? openState
          : {
              isOpen: open,
              setIsOpen: setOpen,
            }
      }
      onClick={handleOpenChange}
      {...props}
    >
      <div className="flex flex-col divide-y divide-x-0 divide-solid divide-grey-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className="p-3 text-sm text-left"
            onClick={() => {
              const keepOpen = action.onClick();
              if (!keepOpen && isOpen) {
                handleOpenChange();
              }
            }}
          >
            {!!action.icon && (
              <Icon icon={action.icon} size={'sm'} className="mr-2" />
            )}
            {action.label}
          </button>
        ))}
      </div>
    </DEPRECATED_ButtonMenu>
  );
};
