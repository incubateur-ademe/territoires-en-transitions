import React, {useState, useEffect, useRef} from 'react';
import {TextInput} from '@dataesr/react-dsfr';

// on va appliquer un offset négatif pour que la hauteur soit réduite quand le
// champ est vide
const OFFSET = -20;

// on doit ausi surcharger la valeur par défaut du dsfr
const TEXTAREA_OVERRIDES = {
  minHeight: '2.75rem',
};

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

  // effet appliqué quand le texte change (chargement donnée ou édition par l'utilisateur)
  useEffect(() => {
    // la hauteur doit être réduite quand le champ est vide
    const offset = value === '' ? OFFSET : 0;
    setParentHeight(`${textAreaRef.current!.scrollHeight}px`);
    setTextAreaHeight(`${textAreaRef.current!.scrollHeight + offset}px`);
  }, [text, value]);

  // appelé quand le champ est édité (va déclencher le recalcul de la hauteur)
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
        style={{...TEXTAREA_OVERRIDES, height: textAreaHeight}}
        onChange={onChangeHandler}
      />
    </div>
  );
};
