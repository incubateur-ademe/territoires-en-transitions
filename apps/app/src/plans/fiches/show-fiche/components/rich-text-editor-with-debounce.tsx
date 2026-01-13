import { RichTextEditor } from '@tet/ui';

export const RichTextEditorWithDebounce = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <RichTextEditor
      initialValue={value}
      onChange={onChange}
      //500 seems like a valid debounce to allow a correct editing.
      //using no delay leads to unwanted text trimming when used in a controller
      debounceDelayOnChange={500}
    />
  );
};
