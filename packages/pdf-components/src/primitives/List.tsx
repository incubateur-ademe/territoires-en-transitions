import { ListElement } from './ListElement';
import { Stack, StackProps } from './Stack';

type ListProps = Omit<StackProps, 'children'> & {
  children:
    | React.ReactElement<typeof ListElement>
    | React.ReactElement<typeof ListElement>[];
};

export const List = ({ children, className, ...props }: ListProps) => {
  return (
    <Stack gap={props.gap ?? 1} className={className} {...props}>
      {children}
    </Stack>
  );
};
