import { Icon } from '@tet/ui';
import classNames from 'classnames';
import styles from './demarche-pcaet.module.css';
import { ETAPES_DEPOT } from './demarche-pcaet.data';

const PIECES = [
  'Diagnostic',
  'Stratégie et objectifs',
  "Programme d'actions",
  'Dispositif de suivi',
];

/**
 * Fenêtre d'app stylisée, en attendant le GIF ou la vidéo de démo : les pièces
 * se déposent une à une pendant que le panneau « Avancement » progresse.
 */
export const DemarchePcaetDemoAnime = () => (
  <div
    role="img"
    aria-label="Aperçu du parcours de dépôt : les pièces du dossier sont déposées une à une et le panneau « Avancement » progresse."
    className="flex flex-col w-full aspect-[4/3] md:aspect-video overflow-hidden bg-white border border-primary-3 rounded-[10px] shadow-[0_8px_24px_rgba(64,64,146,0.10)]"
  >
    <div
      aria-hidden
      className="flex items-center gap-3.5 h-9 px-3.5 border-b border-primary-3"
    >
      <span className="flex gap-[5px]">
        {[0, 1, 2].map((point) => (
          <span key={point} className="size-[9px] rounded-full bg-primary-3" />
        ))}
      </span>
      <span className="text-[9px] font-bold tracking-wide text-bf500">
        TERRITOIRES EN TRANSITIONS
      </span>
      <span className="flex gap-2.5 ml-auto">
        <span className="w-10 h-1.5 rounded-sm bg-primary-2" />
        <span className="w-10 h-1.5 rounded-sm bg-primary-2" />
      </span>
    </div>

    <div
      aria-hidden
      className="grid flex-1 grid-cols-[minmax(0,30%)_1fr] min-h-0"
    >
      <div className="flex flex-col gap-2.5 px-3.5 py-4 border-r border-primary-3">
        <span className="text-[9px] font-bold text-primary-9">AVANCEMENT</span>
        {ETAPES_DEPOT.map((etape, index) => (
          <span key={etape.titre} className="flex items-center gap-2">
            <span
              className={classNames('flex-none size-2.5 rounded-full', {
                [styles[`boucleEtape${index}`]]: index > 0,
                'bg-primary-9': index === 0,
              })}
            />
            <span className="truncate text-[9px] font-medium text-primary-10 max-md:hidden">
              {etape.titre}
            </span>
          </span>
        ))}
      </div>

      <div className="flex flex-col justify-center gap-3 px-4 md:px-6 bg-primary-0">
        <span className="text-[10px] md:text-xs font-bold text-primary-9">
          Documents du dossier
        </span>
        {PIECES.map((piece, index) => (
          <div
            key={piece}
            className="flex items-center gap-2.5 px-2.5 py-1.5 md:py-2 bg-white border border-primary-3 rounded-md"
          >
            <Icon
              icon="file-text-line"
              size="xs"
              className="flex-none text-primary-7"
            />
            <span className="flex flex-col flex-1 gap-1 min-w-0">
              <span className="truncate text-[10px] md:text-xs font-medium text-primary-10">
                {piece}
              </span>
              <span className="relative h-1 overflow-hidden rounded-sm bg-primary-2">
                <span
                  className={classNames(
                    'absolute inset-y-0 left-0 rounded-sm bg-success-1',
                    styles[`boucleRemplissage${index}`]
                  )}
                />
              </span>
            </span>
            <span
              className={classNames(
                'flex flex-none items-center justify-center size-4 rounded-full bg-success-1 text-white',
                styles[`boucleCheck${index}`]
              )}
            >
              <Icon icon="check-line" size="2xs" />
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
