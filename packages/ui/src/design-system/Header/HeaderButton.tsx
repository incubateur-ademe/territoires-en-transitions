import {Button} from '@design-system/Button';
import {ButtonProps} from '@design-system/Button/types';
import classNames from 'classnames';

export type HeaderButtonProps = ButtonProps & {isActive?: boolean};

const HeaderButton = ({isActive, ...props}: HeaderButtonProps) => {
  return (
    <div
      className={classNames('h-fit pb-0 max-lg:w-full border-b-2', {
        'border-b-primary-9': isActive,
        'border-b-transparent hover:!border-b-primary-1': !isActive,
      })}
    >
      <Button {...props} />
    </div>
  );
};

export default HeaderButton;
