import {Ref, forwardRef} from 'react';
import DropdownFloater from '../../../components/floating-ui/DropdownFloater';

import {CreateOption} from './Select';
import {Option} from './Options';
import {Icon} from '../../icons/Icon';
import {Button} from '../../buttons/button/Button';

type Props = {
  option: Option;
  createProps: CreateOption;
};

export const OptionMenu = ({option, createProps}: Props) => (
  <DropdownFloater
    offsetValue={{mainAxis: 6}}
    placement="top-end"
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
          <Icon icon="edit-line" size="sm" className="mr-2" />
          Éditer
        </button>
        <button
          className="flex items-center w-full py-2 pr-4 pl-3 text-sm text-grey-8"
          onClick={() => createProps.onDelete(option.value)}
        >
          <Icon icon="delete-bin-6-line" size="sm" className="mr-2" />
          Supprimer
        </button>
      </div>
    )}
  >
    <OptionMenuButton />
  </DropdownFloater>
);

/** Bouton pour ouvrir le menu d'une option */
const OptionMenuButton = forwardRef((props, ref?: Ref<HTMLButtonElement>) => (
  <div className="flex px-3 py-1.5 my-auto group-hover:bg-primary-0 hover:!bg-white">
    <Button
      ref={ref}
      icon="more-line"
      size="xs"
      variant="white"
      className="!p-1 m-auto"
      {...props}
    />
  </div>
));
OptionMenuButton.displayName = 'OptionOpenFloaterButton';
