import { RichTextEditor } from '@tet/ui';

export const RichTextEditorWithDebounce = ({
  value,
  onChange,

  contentStyle,
}: {
  value: string;
  onChange: (value: string) => void;
  contentStyle?: {
    size?: 'xs' | 'sm' | 'base' | 'lg';
    color?: 'white' | 'grey' | 'primary';
  };
}) => {
  return (
    <RichTextEditor
      contentStyle={contentStyle}
      unstyled
      initialValue={value}
      onChange={onChange}
      //500 seems like a valid debounce to allow a correct editing.
      //using no delay leads to unwanted text trimming when used in a controller
      debounceDelayOnChange={500}
    />
  );
};
