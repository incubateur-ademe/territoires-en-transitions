/**
 * Proposition : nouveau composant
 * Besoin : une liste de paires terme / valeur (pilotage) et une liste de
 * lignes libellé / montant avec total (financement) ; le design system n'a
 * pas de liste de description.
 * Espacement hors échelle : 12px entre les paires.
 */
export const DefinitionList = ({
  items,
}: {
  items: ReadonlyArray<Readonly<{ terme: string; valeur: string }>>;
}) => (
  <dl className="flex flex-col gap-3 text-sm font-normal">
    {items.map(({ terme, valeur }) => (
      <div key={terme}>
        <dt className="text-grey-8">{terme}</dt>
        <dd className="m-0 font-medium text-primary-10">{valeur}</dd>
      </div>
    ))}
  </dl>
);

export const AmountList = ({
  lignes,
  totalLibelle,
  total,
}: {
  lignes: ReadonlyArray<Readonly<{ libelle: string; montant: string }>>;
  totalLibelle: string;
  total: string;
}) => (
  <dl className="flex flex-col gap-2 text-sm font-normal">
    {lignes.map(({ libelle, montant }) => (
      <div
        key={libelle}
        className="flex justify-between gap-2 border-b border-grey-3 pb-2"
      >
        <dt>{libelle}</dt>
        <dd className="m-0 font-bold tabular-nums text-primary-10">
          {montant}
        </dd>
      </div>
    ))}
    <div className="flex justify-between gap-2 font-bold text-primary-9">
      <dt>{totalLibelle}</dt>
      <dd className="m-0 tabular-nums">{total}</dd>
    </div>
  </dl>
);
