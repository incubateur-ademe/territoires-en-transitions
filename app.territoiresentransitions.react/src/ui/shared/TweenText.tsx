import {useEffect, useState} from 'react';

/**
 * Permet d'animer la transition entre des valeurs successives
 * d'une *ligne* de texte.
 *
 * @param props.text le texte à afficher
 * @param props.align-right aligne le texte à droite
 * @param props.align-left aligne le texte à gauche
 */
export const TweenText = (props: { text: string, 'align-right'?: boolean, 'align-left'?: boolean}) => {
  const [a, setA] = useState<string>(props.text);
  const [b, setB] = useState<string>(props.text);
  const [aVisibility, setAVisibility] = useState<boolean>(true);

  useEffect(() => {
    if (props.text === a && aVisibility) return;
    if (props.text === b && !aVisibility) return;

    if (!aVisibility) {
      setA(props.text);
      setAVisibility(true);
    } else {
      setB(props.text);
      setAVisibility(false);
    }
  }, [props.text]);

  const slotClassName = `absolute top-0 transition-opacity duration-300 ease-in-out ${props['align-left'] ? 'left-0' : ''} ${props['align-right'] ? 'right-0' : ''}`;
  const slotAClassName = `${slotClassName} ${aVisibility ?
    'opacity-100' :
    'opacity-0'}`;
  const slotBClassName = `${slotClassName} ${aVisibility ?
    'opacity-0' :
    'opacity-100'}`;

  return <div className="relative whitespace-nowrap">
    {/* Le texte transparent permet de calculer la taille du parent */}
    <span className="text-transparent">{props.text}</span>
    {/* Les deux slots qui changent d'opacité */}
    <div className={slotAClassName}>{a}</div>
    <div className={slotBClassName}>{b}</div>
  </div>;
};
