import classNames from 'classnames';

/**
 * Curseur simulé d'une démo. Ses déplacements sont lissés par transition CSS :
 * la scène ne fournit que la position du jalon courant.
 */
export const DemoCursor = ({
  x,
  y,
  visible,
  pressed,
  variant,
  transition = 650,
}: {
  x: number;
  y: number;
  visible: boolean;
  /** Le clic (ou le toucher) en cours, rendu par un léger écrasement. */
  pressed: boolean;
  variant: 'mouse' | 'touch';
  /** Durée du déplacement vers la position courante, en ms. */
  transition?: number;
}) => (
  <div
    className="absolute z-10 pointer-events-none transition-[left,top,opacity] ease-[cubic-bezier(0.4,0,0.2,1)]"
    style={{
      left: x,
      top: y,
      opacity: visible ? 1 : 0,
      transitionDuration: `${transition}ms, ${transition}ms, 300ms`,
    }}
  >
    {variant === 'mouse' ? (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className="origin-[3px_2px] transition-transform duration-[120ms] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]"
        style={{ transform: `scale(${pressed ? 0.82 : 1})` }}
      >
        <path
          d="M3 2l7 19 2.6-7.6L20 11z"
          fill="#161616"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <span
        className={classNames(
          'block size-[34px] -ml-[17px] -mt-[17px] rounded-full border-2 border-primary-9/50 bg-primary-9/20 transition-transform duration-[120ms]',
          { 'scale-[0.82]': pressed }
        )}
      />
    )}
  </div>
);
