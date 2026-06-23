import { JSX } from 'react';

/**
 * Avatar-label-group : pastille d'initiales + nom + email.
 * @tet/ui n'expose pas de composant Avatar/AvatarLabelGroup → composition
 * maison sur la palette DS.
 */
const initials = (nom: string): string =>
  nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export const DrealContactCell = ({
  nom,
  email,
}: {
  nom: string;
  email: string;
}): JSX.Element => (
  <div className="flex items-center gap-3">
    <div className="flex-none flex items-center justify-center w-9 h-9 rounded-full bg-primary-2 text-primary-9 text-sm font-medium">
      {initials(nom)}
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-sm text-primary-10 truncate">{nom}</span>
      <a
        href={`mailto:${email}`}
        className="text-xs text-primary-7 hover:underline truncate"
      >
        {email}
      </a>
    </div>
  </div>
);
