import { useState } from 'react';

import { OpenState } from '../utils/types';

/** Hook to manage open state when a component can be controlled or uncontrolled */
export const useOpenState = (openState?: OpenState) => {
  const isControlled = !!openState;
  const [open, setOpen] = useState(false);
  const isOpen = isControlled ? openState.isOpen : open;

  const toggleIsOpen = () => {
    if (isControlled) {
      openState.setIsOpen(!openState.isOpen);
    } else {
      setOpen(!open);
    }
  };

  return {
    isOpen,
    toggleIsOpen,
  };
};
