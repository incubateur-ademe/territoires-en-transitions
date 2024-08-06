import {Input} from '@tet/ui';
import classNames from 'classnames';
import {TEditState} from 'core-logic/hooks/useEditState';

type DocumentInputProps = {
  editElement: TEditState;
  className?: string;
};

const DocumentInput = ({editElement, className}: DocumentInputProps) => {
  return (
    <Input
      type="text"
      autoFocus
      value={editElement.value}
      onChange={evt => editElement.setValue(evt.target.value)}
      onBlur={editElement.exit}
      onKeyUp={evt => {
        if (evt.key === 'Enter') editElement.exit();
      }}
      className={classNames('font-normal', className)}
    />
  );
};

export default DocumentInput;
