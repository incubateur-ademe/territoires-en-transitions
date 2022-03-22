import {ReactNode} from 'react';

/*
  Affiche une mise en exergue mais avec des bordures, pas de marge gauche et des
 couleurs non définies dans les classes fr-highlight--xxx
*/

export const YellowHighlight = (props: {children: ReactNode}) => (
  <Highlight color="var(--yellow-moutarde-850)" {...props} />
);

const Highlight = ({color, children}: {color: string; children: ReactNode}) => (
  <div
    className="fr-highlight"
    style={{
      boxShadow: `inset 0.25rem 0 0 0 ${color}`,
      marginLeft: 0,
      maxWidth: 'fit-content',
      paddingRight: '2rem',
      paddingTop: '1rem',
      paddingBottom: '1rem',
      border: `1px solid ${color}`,
    }}
  >
    {children}
  </div>
);
