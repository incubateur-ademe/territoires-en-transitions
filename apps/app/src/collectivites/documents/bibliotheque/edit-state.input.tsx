import { Input, Textarea } from '@tet/ui';
import classNames from 'classnames';
import { EditState } from './use-edit-state';

type EditStateInputProps = {
  editElement: EditState;
  type?: 'text' | 'textarea';
  className?: string;
};

export const EditStateInput = ({
  editElement,
  type = 'text',
  className,
}: EditStateInputProps) => {
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
