export const DesactiverLesFiltres = (props: {onClick: () => void}) => {
  // fixme. hard navigate to reset filters
  return (
    <div className="w-max mt-4 border-b border-bf500 md:mt-auto">
      <button
        onClick={props.onClick}
        className="flex items-center text-bf500 hover:!bg-none"
      >
        <span className="fr-fi-close-circle-fill mr-1 scale-90"></span>
        <span className="text-sm">Désactiver tous les filtres</span>
      </button>
    </div>
  );
};
