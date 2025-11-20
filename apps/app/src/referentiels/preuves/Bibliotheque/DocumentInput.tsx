import { Input, Textarea } from '@tet/ui';
import classNames from 'classnames';
import { TEditState } from './useEditState';

type DocumentInputProps = {
  editElement: TEditState;
  type?: 'text' | 'textarea';
  className?: string;
};

const DocumentInput = ({
  editElement,
  type = 'text',
  className,
}: DocumentInputProps) => {
  return type === 'text' ? (
    <Input
      type="text"
      autoFocus
      value={editElement.value}
      onChange={(evt) => editElement.setValue(evt.target.value)}
      onBlur={editElement.exit}
      onKeyUp={(evt) => {
        if (evt.key === 'Enter') editElement.exit();
      }}
      className={classNames('font-normal', className)}
    />
  ) : (
    <Textarea
      autoFocus
      value={editElement.value}
      onChange={(evt) =>
        editElement.setValue((evt.target as HTMLTextAreaElement).value)
      }
      onBlur={editElement.exit}
      onKeyDown={(evt) => {
        if (evt.key === 'Enter' && !evt.shiftKey) editElement.exit();
      }}
      className={classNames('font-normal', className)}
    />
  );
};

export default DocumentInput;
