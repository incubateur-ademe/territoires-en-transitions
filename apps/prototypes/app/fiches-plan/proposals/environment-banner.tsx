import { Icon, IconValue } from '@tet/ui';
import { useEffect, useRef, useState } from 'react';

/**
 * Proposition : nouveau composant `EnvironmentBanner`
 * Besoin : signaler en haut de chaque page que l'environnement n'est pas la
 * production (développement, recette, préproduction). Message qui défile en
 * continu, en pause au survol, figé si `prefers-reduced-motion`, annoncé une
 * seule fois aux lecteurs d'écran. Dans l'app, il se monterait au-dessus du
 * `Header`, dans `AppShell` : le prototype l'affiche en tête de page faute
 * de pouvoir le placer là.
 */

type Variant = 'warning' | 'info' | 'new';

const toneClassNames: Record<Variant, string> = {
  warning: 'bg-warning-2 border-warning-3',
  info: 'bg-info-2 border-info-3',
  new: 'bg-new-2 border-new-1',
};

/** Nombre de répétitions du message : assez pour couvrir un écran large deux fois. */
const REPETITIONS = 12;

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export const EnvironmentBanner = ({
  message = 'En cours de développement',
  variant = 'warning',
  icon = 'tools-line',
  speed = 30,
}: {
  message?: string;
  variant?: Variant;
  icon?: IconValue;
  /** Durée d'un tour de défilement, en secondes. */
  speed?: number;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [animation, setAnimation] = useState<Animation | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track?.animate || prefersReducedMotion()) return;
    const scroll = track.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: speed * 1000, iterations: Infinity, easing: 'linear' },
    );
    setAnimation(scroll);
    return () => scroll.cancel();
  }, [speed]);

  return (
    <div
      role="status"
      aria-label={message}
      onMouseEnter={() => animation?.pause()}
      onMouseLeave={() => animation?.play()}
      className={`w-full overflow-hidden border-b py-2 text-sm font-bold text-primary-10 ${toneClassNames[variant]}`}
    >
      <div ref={trackRef} aria-hidden="true" className="flex w-max">
        {Array.from({ length: REPETITIONS }, (_, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-2 whitespace-nowrap px-8"
          >
            <Icon icon={icon} size="sm" />
            {message}
          </span>
        ))}
      </div>
    </div>
  );
};
