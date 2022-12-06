import {TextInput} from '@dataesr/react-dsfr';
import {useAutoSizeTextarea} from './form/useAutoSizeTextarea';

export const AutoTextArea = (props: TextInput<HTMLInputElement>) => {
  const {value, onChange} = props;

  const textareaRef = useAutoSizeTextarea(value);

  return (
    <TextInput textarea {...props} ref={textareaRef} onChange={onChange} />
  );
};
