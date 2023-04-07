/**
 * Fil d'ariane avec des boutons
 *
 * @param displayedNames
 * @param handleClick
 */

type FilArianeButtonsProps = {
  displayedNames: string[];
  handleClick: (index: number) => void;
};

const FilArianeButtons = ({
  displayedNames,
  handleClick,
}: FilArianeButtonsProps): JSX.Element => {
  return (
    <div className="flex items-center flex-wrap gap-y-0.5 text-xs text-gray-500 ">
      {displayedNames.map((name, index) => (
        <div key={name} className="flex items-center shrink-0">
          <button
            disabled={index === displayedNames.length - 1}
            style={{
              cursor:
                index === displayedNames.length - 1 ? 'default' : 'pointer',
            }}
            onClick={() => handleClick(index)}
          >
            <span
              className={index + 1 < displayedNames.length ? 'underline' : ''}
            >
              {name}
            </span>
          </button>
          {index + 1 < displayedNames.length && (
            <div className="fr-fi-arrow-down-s-line scale-75 shrink-0 -rotate-90" />
          )}
        </div>
      ))}
    </div>
  );
};

export default FilArianeButtons;
