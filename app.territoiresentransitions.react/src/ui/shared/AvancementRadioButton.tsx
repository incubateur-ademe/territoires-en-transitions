import './AvancementRadioButton.css';
import type {Avancement, Option} from 'types';

// TODO / Question : Fiche action and Ref actions have the same avancement options ?
export const AvancementRadioButton = (props: {
  avancements: Option<Avancement>[];
  optionIsChecked: ({option}: {option: Option<Avancement>}) => boolean;
  onClick: ({option}: {option: Option<Avancement>}) => Promise<void>;
}) => {
  return (
    <div className="AvancementRadioButton">
      <fieldset>
        {props.avancements.map(option => {
          const checked = props.optionIsChecked({option});
          return (
            <div key={option.value} className="mx-1">
              <input
                value={option.value}
                name="actionStatusAvancement"
                type="radio"
              />
              <label
                className={`border rounded-l flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400 text-gray-700 ${
                  checked ? 'checked' : ''
                }`}
                onClick={async () => {
                  await props.onClick({option});
                }}
              >
                <span>{option.label}</span>
              </label>
            </div>
          );
        })}
      </fieldset>
    </div>
  );
};
