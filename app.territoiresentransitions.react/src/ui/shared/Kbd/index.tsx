import './Kbd.css';

export type TKbdProps = {children: string};

/**
 * Affiche la représentation d'une touche clavier
 */
export const Kbd = (props: TKbdProps) => <kbd>{props.children}</kbd>;
