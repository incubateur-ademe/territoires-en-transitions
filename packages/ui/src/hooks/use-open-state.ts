import { useState } from 'react';

import { OpenState } from '../utils/types';

/** Hook to manage open state when a component can be controlled or uncontrolled */
export const useOpenState = (openState?: OpenState) => {
  const [open, setOpen] = useState(false);

  const isControlled = !!openState;

  const isOpen = isControlled ? openState.isOpen : open;

  const setIsOpen = isControlled
    ? openState.setIsOpen
    : (isOpen: boolean) => setOpen(isOpen);

  const toggleIsOpen = () => {
    if (isControlled) {
      openState.setIsOpen(!openState.isOpen);
    } else {
      setOpen(!open);
    }
  };

  return {
    isOpen,
    setIsOpen,
    toggleIsOpen,
  };
};
