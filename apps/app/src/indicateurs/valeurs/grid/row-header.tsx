import { JSX } from 'react';

type RowHeaderProps = {
  label: string;
};

export const RowHeader = ({ label }: RowHeaderProps): JSX.Element => (
  <th
    scope="row"
    role="rowheader"
    className="sticky left-0 z-10 bg-white p-2 text-left font-medium text-primary-9"
  >
    {label}
  </th>
);
