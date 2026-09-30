import { JSX } from 'react';

type NotImplementedPlaceholderProps = {
  componentName: string;
};

export const NotImplementedPlaceholder = ({
  componentName,
}: NotImplementedPlaceholderProps): JSX.Element => (
  <p role="note">{componentName}</p>
);
