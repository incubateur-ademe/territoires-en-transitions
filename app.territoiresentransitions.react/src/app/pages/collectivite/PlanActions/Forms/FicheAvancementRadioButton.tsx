import './FicheAvancementRadioButton.css';
import type {Option} from 'types';
import {currentCollectiviteBloc} from 'core-logic/observables';
import {FicheActionAvancementRenseigne} from 'app/labels';

// TODO / Question : Fiche action and Ref actions have the same avancement options ?
export const FicheAvancementRadioButton = (props: {
  avancements: Option<FicheActionAvancementRenseigne>[];
  optionIsChecked: ({
    option,
  }: {
    option: Option<FicheActionAvancementRenseigne>;
  }) => boolean;
  onClick: ({
    option,
  }: {
    option: Option<FicheActionAvancementRenseigne>;
  }) => Promise<void>;
}) => {
  return (
    <div className="FicheAvancementRadioButton">
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
