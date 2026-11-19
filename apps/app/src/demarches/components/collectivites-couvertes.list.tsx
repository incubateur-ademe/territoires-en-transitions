import type { ReactNode } from 'react';

type CollectiviteCouverteItem = {
  id: number;
  nom: string;
  badge?: ReactNode;
};

/**
 * Les EPCI que couvre le dépôt d'un Supra, en liste compacte sous son nom. Ni
 * statut, ni dates, ni action : ce sont ceux du dépôt.
 */
export const CollectivitesCouvertesList = ({
  collectivites,
  dataTest,
}: {
  collectivites: CollectiviteCouverteItem[];
  /** Préfixe : chaque item le complète de son identifiant. */
  dataTest: string;
}) => (
  <ul className="m-0 flex list-none flex-col gap-1 p-0">
    {collectivites.map(({ id, nom, badge }) => (
      <li
        key={id}
        className="flex items-start gap-2 p-0"
        data-test={`${dataTest}-${id}`}
      >
        <span
          aria-hidden
          className="mt-0.5 h-3 w-2.5 shrink-0 border-b border-l border-grey-5"
        />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-primary-9">{nom}</span>
          {badge}
        </div>
      </li>
    ))}
  </ul>
);
