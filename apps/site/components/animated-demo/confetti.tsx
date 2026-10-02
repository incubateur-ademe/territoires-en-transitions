import { CSSProperties } from 'react';
import styles from './animated-demo.module.css';

const COLORS = [
  '#6A6AF4',
  '#F4C447',
  '#48A775',
  '#FFE4A8',
  '#404092',
  '#F28E40',
];
const PARTICLE_COUNT = 56;

/** Particules calculées une fois : la même gerbe à chaque lecture. */
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2 + (index % 3) * 0.3;
  const speed = 160 + ((index * 53) % 220);
  return {
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed * 0.7 - 120,
    rotation: ((index * 97) % 720) - 360,
    color: COLORS[index % COLORS.length],
    width: 6 + (index % 3) * 3,
    height: 10 + (index % 2) * 6,
    delay: (index % 7) * 0.03,
  };
});

/** Gerbe de confettis partant de (`x`, `y`), réduite par `scale`. */
export const Confetti = ({
  x,
  y,
  scale = { size: 1, dx: 1, dy: 1 },
}: {
  x: number;
  y: number;
  scale?: { size: number; dx: number; dy: number };
}) => (
  <div
    aria-hidden
    className="absolute z-[5] size-0 pointer-events-none"
    style={{ left: x, top: y }}
  >
    {PARTICLES.map((particle, index) => (
      <span
        key={index}
        className={`absolute left-0 top-0 rounded-sm ${styles.confetti}`}
        style={
          {
            width: particle.width * scale.size,
            height: particle.height * scale.size,
            background: particle.color,
            animationDelay: `${particle.delay}s`,
            '--dx': `${particle.dx * scale.dx}px`,
            '--dy': `${particle.dy * scale.dy}px`,
            '--r': `${particle.rotation}deg`,
          } as CSSProperties
        }
      />
    ))}
  </div>
);
