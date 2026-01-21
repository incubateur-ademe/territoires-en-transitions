import { useState } from 'react';

import { OpenState } from '../utils/types';

/** Hook to manage open state when a component can be controlled or uncontrolled */
export const useOpenState = (openState?: OpenState | { isOpen: boolean }) => {
  const [open, setOpen] = useState(openState?.isOpen ?? false);

  const isControlled = openState !== undefined && 'setIsOpen' in openState;

  const { isOpen, setIsOpen } = isControlled
    ? openState
    : { isOpen: open, setIsOpen: setOpen };

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
