import {Ref, forwardRef} from 'react';
import {ButtonProps} from './types';
import {Button} from './Button';
import {Notification, NotificationVariant} from '../Notification';
import classNames from 'classnames';

export const NotificationButton = forwardRef(
  (
    {
      notificationValue,
      notificationVariant,
      containerclassName,
      ...props
    }: {
      notificationValue: number;
      notificationVariant?: NotificationVariant;
      containerclassName?: string;
    } & ButtonProps,
    ref?: Ref<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    return (
      <div className={classNames('relative w-fit h-fit', containerclassName)}>
        <Button ref={ref} {...props} />
        <Notification
          size="xs"
          variant={notificationVariant}
          number={notificationValue}
          classname="h-6 w-6 !p-0 justify-center absolute top-0 right-0 translate-x-1/3 -translate-y-1/3"
        />
      </div>
    );
  }
);
