import { ListElement, Stack, StackProps } from '@/app/ui/export-pdf/components';

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
