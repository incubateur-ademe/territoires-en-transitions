import { CSSProperties } from 'react';
import styles from './demo-animee.module.css';

const COULEURS = [
  '#6A6AF4',
  '#F4C447',
  '#48A775',
  '#FFE4A8',
  '#404092',
  '#F28E40',
];
const NOMBRE = 56;

/** Particules calculées une fois : la même gerbe à chaque lecture. */
const PARTICULES = Array.from({ length: NOMBRE }, (_, index) => {
  const angle = (index / NOMBRE) * Math.PI * 2 + (index % 3) * 0.3;
  const vitesse = 160 + ((index * 53) % 220);
  return {
    dx: Math.cos(angle) * vitesse,
    dy: Math.sin(angle) * vitesse * 0.7 - 120,
    rotation: ((index * 97) % 720) - 360,
    couleur: COULEURS[index % COULEURS.length],
    largeur: 6 + (index % 3) * 3,
    hauteur: 10 + (index % 2) * 6,
    retard: (index % 7) * 0.03,
  };
});

/** Gerbe de confettis partant de (`x`, `y`), réduite par `echelle`. */
export const Confettis = ({
  x,
  y,
  echelle = { taille: 1, dx: 1, dy: 1 },
}: {
  x: number;
  y: number;
  echelle?: { taille: number; dx: number; dy: number };
}) => (
  <div
    aria-hidden
    className="absolute z-[5] size-0 pointer-events-none"
    style={{ left: x, top: y }}
  >
    {PARTICULES.map((particule, index) => (
      <span
        key={index}
        className={`absolute left-0 top-0 rounded-sm ${styles.confetti}`}
        style={
          {
            width: particule.largeur * echelle.taille,
            height: particule.hauteur * echelle.taille,
            background: particule.couleur,
            animationDelay: `${particule.retard}s`,
            '--dx': `${particule.dx * echelle.dx}px`,
            '--dy': `${particule.dy * echelle.dy}px`,
            '--r': `${particule.rotation}deg`,
          } as CSSProperties
        }
      />
    ))}
  </div>
);
