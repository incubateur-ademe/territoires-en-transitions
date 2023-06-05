/** Affiche le picto et le libellé pour un critère rempli */
export const CritereRempli = ({className}: {className?: string}) => (
  <i
    className={`flex fr-icon fr-icon-checkbox-circle-fill before:text-success before:pr-3 fr-text--sm fr-mb-0 fr-ml-3w ${
      className ? className : ''
    }`}
  >
    Terminé
  </i>
);
