import React, {useState, useEffect, useRef} from 'react';
import {TextInput} from '@dataesr/react-dsfr';

/**
 * Rend un champ de saisi qui se redimensionne en fonction de son contenu.
 * copié/adapté depuis: https://medium.com/@lucasalgus/creating-a-custom-auto-resize-textarea-component-for-your-react-web-application-6959c0ad68bc
 * (il ne parait pas nécessaire d'ajouter une dépendance supplémentaire pour cette fonctionnalité)
 */
export const AutoTextArea = (props: TextInput<HTMLInputElement>) => {
  const {value} = props;
  const textAreaRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value);
  const [textAreaHeight, setTextAreaHeight] = useState('auto');
  const [parentHeight, setParentHeight] = useState('auto');

  useEffect(() => {
    setParentHeight(`${textAreaRef.current!.scrollHeight}px`);
    setTextAreaHeight(`${textAreaRef.current!.scrollHeight}px`);
  }, [text, value]);

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextAreaHeight('auto');
    setParentHeight(`${textAreaRef.current!.scrollHeight}px`);
    setText(event.target.value);

    if (props.onChange) {
      props.onChange(event);
    }
  };

  return (
    <div
      style={{
        minHeight: parentHeight,
      }}
    >
      <TextInput
        textarea
        {...props}
        ref={textAreaRef}
        style={{height: textAreaHeight}}
        onChange={onChangeHandler}
      />
    </div>
  );
};
