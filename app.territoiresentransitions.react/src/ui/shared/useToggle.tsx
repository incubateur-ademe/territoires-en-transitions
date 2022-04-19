import {ChangeEvent, useState} from 'react';

export const useToggle = (
  initialValue = false
): [
  opened: boolean,
  onToggle: (event?: ChangeEvent<HTMLDetailsElement>) => void
] => {
  const [opened, setOpened] = useState(Boolean(initialValue));

  const handleToggle = (event?: ChangeEvent<HTMLDetailsElement>) => {
    event?.preventDefault();
    setOpened(!opened);
  };

  return [opened, handleToggle];
};
