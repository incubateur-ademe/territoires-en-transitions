import './AvancementRadioButton.css';
import type {Option} from 'types';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {RadioButtonActionAvancement} from 'app/labels';

// TODO / Question : Fiche action and Ref actions have the same avancement options ?
export const AvancementRadioButton = (props: {
  avancements: Option<RadioButtonActionAvancement>[];
  optionIsChecked: ({
    option,
  }: {
    option: Option<RadioButtonActionAvancement>;
  }) => boolean;
  onClick: ({
    option,
  }: {
    option: Option<RadioButtonActionAvancement>;
  }) => Promise<void>;
}) => {
  return (
    <div className="AvancementRadioButton">
      <fieldset disabled={currentCollectiviteBloc.readonly}>
        {props.avancements.map(option => {
          const checked = props.optionIsChecked({option});
          return (
            <div key={option.value} className="mx-1">
              <input
                value={option.value}
                name="actionStatusAvancement"
                type="radio"
                disabled={currentCollectiviteBloc.readonly}
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
