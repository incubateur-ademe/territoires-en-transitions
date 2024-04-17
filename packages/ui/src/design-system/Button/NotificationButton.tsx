import {Ref, forwardRef} from 'react';
import {ButtonProps} from './types';
import {Button} from './Button';
import {Notification, NotificationVariant} from '../Notification';

export const NotificationButton = forwardRef(
  (
    {
      notificationValue,
      notificationVariant,
      ...props
    }: {
      notificationValue?: number;
      notificationVariant?: NotificationVariant;
    } & ButtonProps,
    ref?: Ref<HTMLButtonElement | HTMLAnchorElement>
  ) => {
    return (
      <div className="relative w-fit h-fit">
        <Button ref={ref} {...props} />
        {notificationValue !== undefined && (
          <Notification
            size="xs"
            variant={notificationVariant}
            number={notificationValue}
            classname="h-6 w-6 !p-0 justify-center absolute top-0 right-0 translate-x-1/3 -translate-y-1/3"
          />
        )}
      </div>
    );
  }
);
