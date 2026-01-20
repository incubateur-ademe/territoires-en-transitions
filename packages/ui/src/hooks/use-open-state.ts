import { useState } from 'react';

import { OpenState } from '../utils/types';

/** Hook to manage open state when a component can be controlled or uncontrolled */
export const useOpenState = (openState?: OpenState) => {
  const [open, setOpen] = useState(openState?.isOpen ?? false);

  const isControlled = !!openState?.setIsOpen;

  const isOpen = isControlled ? openState.isOpen : open;

  const setIsOpen = openState?.setIsOpen ? openState.setIsOpen : setOpen;

  const toggleIsOpen = () => {
    const currentState = isControlled ? openState.isOpen : open;
    setIsOpen(!currentState);
  };

  return {
    isOpen,
    setIsOpen,
    toggleIsOpen,
  };
};
