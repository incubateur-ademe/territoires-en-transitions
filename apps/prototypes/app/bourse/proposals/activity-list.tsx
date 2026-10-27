/**
 * Proposition : nouveau composant
 * Besoin : un fil d'activité (texte, date) ; espacement hors échelle : 12px
 * entre les entrées, entre `sm` (8px) et `md` (16px).
 */
export const ActivityList = ({
  activites,
}: {
  activites: ReadonlyArray<Readonly<{ texte: string; date: string }>>;
}) => (
  <ul className="flex flex-col gap-3 text-sm font-normal">
    {activites.map(({ texte, date }) => (
      <li key={texte} className="flex flex-col">
        <span>{texte}</span>
        <span className="text-xs text-grey-8">{date}</span>
      </li>
    ))}
  </ul>
);
