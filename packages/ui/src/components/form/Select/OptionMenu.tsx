import {Ref, forwardRef} from 'react';
import DropdownFloater from '../../floating-ui/DropdownFloater';

import {CreateOption} from './Select';
import {Option} from './Options';

type Props = {
  option: Option;
  createProps: CreateOption;
};

export const OptionMenu = ({option, createProps}: Props) => (
  <DropdownFloater
    placement="top"
    offsetValue={{mainAxis: 8}}
    noDropdownStyles
    render={() => (
      <div
        className="flex flex-col divide-y divide-x-0 divide-solid divide-grey-3 rounded overflow-hidden bg-white border border-grey-3"
        onClick={evt => {
          evt.stopPropagation();
        }}
      >
        <button
          className="flex items-center w-full py-2 pr-4 pl-3 text-sm text-grey-8"
          onClick={() => createProps.onUpdate(option.value, 'TODO')}
        >
          <span className="flex fr-icon-edit-line before:w-4 before:h-4 mr-2" />
          Éditer
        </button>
        <button
          className="flex items-center w-full py-2 pr-4 pl-3 text-sm text-grey-8"
          onClick={() => createProps.onDelete(option.value)}
        >
          <span className="flex fr-icon-delete-line before:w-4 before:h-4 mr-2" />
          Supprimer
        </button>
      </div>
    )}
  >
    <OptionMenuButton />
  </DropdownFloater>
);

/** Bouton pour ouvrir le menu d'une option */
const OptionMenuButton = forwardRef((props, ref?: Ref<HTMLDivElement>) => (
  <div
    ref={ref}
    className="flex ml-6"
    onClick={evt => {
      evt.stopPropagation();
    }}
  >
    {/** Donne les props à un élément enfant afin de pouvoir donner le stopPropagation au onClick du parent */}
    <div
      {...props}
      className="my-auto p-1 rounded-lg cursor-pointer hover:bg-primary-2"
    >
      <span className="flex fr-icon-more-line before:w-5 before:h-5" />
    </div>
  </div>
));
OptionMenuButton.displayName = 'OptionOpenFloaterButton';
