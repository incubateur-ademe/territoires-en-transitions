import {SyntheticEvent, useState} from 'react';

export const useToggle = (
  initialValue = false
): [
  opened: boolean,
  onToggle: (event?: SyntheticEvent<HTMLElement, Event>) => void
] => {
  const [opened, setOpened] = useState(Boolean(initialValue));

  const handleToggle = (event?: SyntheticEvent<HTMLElement, Event>) => {
    event?.preventDefault();
    setOpened(!opened);
  };

  return [opened, handleToggle];
};
