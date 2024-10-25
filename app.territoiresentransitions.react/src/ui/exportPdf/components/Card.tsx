import classNames from 'classnames';
import { Stack, StackProps } from '../components';

type CardProps = StackProps;

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <Stack
      className={classNames(
        'border border-grey-3 rounded-lg py-5 px-4',
        className
      )}
      {...props}
    >
      {children}
    </Stack>
  );
};
