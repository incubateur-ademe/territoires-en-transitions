import { JSX } from 'react';

export const DrealContactCell = ({
  nom,
  email,
}: {
  nom: string;
  email: string;
}): JSX.Element => (
  <div className="flex flex-col min-w-0">
    <span className="text-sm text-primary-10 truncate">{nom}</span>
    <a
      href={`mailto:${email}`}
      className="text-xs text-primary-7 hover:underline truncate"
    >
      {email}
    </a>
  </div>
);
