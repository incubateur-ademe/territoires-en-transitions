import { Stack, StackProps } from './Stack';
import classNames from 'classnames';

type CardProps = StackProps;

export const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <Stack
      className={classNames('border border-grey-3 rounded-lg p-4', className)}
      {...props}
    >
      {children}
    </Stack>
  );
};
