import type { EpciStorable } from "storables/EpciStorable";

type EpciCardProps = { epci: EpciStorable };
export const EpciCard = ({ epci }: EpciCardProps) => (
  <div className="flex flex-col items-center pt-8 pr-6 pb-6">
    <h3 className="fr-h3 mb-6">{epci.nom}</h3>
    <button
      className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right"
      onClick={() => console.log('goto("fiches", epci.uid)')}
    >
      Plan d'actions
    </button>

    <button
      className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right"
      onClick={() => console.log('goto("actions_referentiels", epci.uid)')}
    >
      Référentiels
    </button>

    <button
      className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-arrow-right-line fr-btn--icon-right"
      onClick={() => console.log('goto("indicateurs", epci.uid)')}
    >
      Indicateurs
    </button>
  </div>
);
