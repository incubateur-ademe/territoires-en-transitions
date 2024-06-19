/** Affiche le picto et le libellé pour un critère rempli */
export const CritereRempli = ({className}: {className?: string}) => (
  <i
    className={`flex items-center gap-1 fr-icon fr-icon-checkbox-circle-fill before:text-success before:pr-3 text-sm ml-6 ${
      className ? className : ''
    }`}
  >
    Terminé
  </i>
);
