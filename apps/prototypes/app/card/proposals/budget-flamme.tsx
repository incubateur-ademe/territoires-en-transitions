/**
 * Proposition : nouveau composant
 * Besoin : signaler un budget prévisionnel élevé (au-delà d'un seuil) à côté
 * du montant, par trois flammes animées ; aucun composant ni token de
 * `@tet/ui` ne couvre ce besoin. Option conforme la plus proche :
 * `Badge variant="high"` « Budget élevé ».
 */

type Flamme = Readonly<{
  couleur: 'fill-orange-1' | 'fill-error-1';
  duree: string;
  decalage: string;
  forme: string;
  coeur: Readonly<{ duree: string; forme: string }>;
}>;

const FORME_FLAMME =
  'M12 2 C13 5.5 17 8 17 13 A5 5 0 0 1 7 13 C7 10.5 8.5 9 9.5 7.5 C10 9.5 11 11 12 11 C12 8 11 5 12 2 Z';
const FORME_COEUR =
  'M12 12 C13 13.5 14.5 14.5 14.5 16.5 A2.5 2.5 0 0 1 9.5 16.5 C9.5 15 11 14 12 12 Z';

const oscillation = (repos: string, souffle: string): string =>
  [repos, souffle, repos].join(';');

const flammes: ReadonlyArray<Flamme> = [
  {
    couleur: 'fill-orange-1',
    duree: '0.7s',
    decalage: '0s',
    forme:
      'M13 3 C13.5 6 17 8.5 17 13 A5 5 0 0 1 7 13 C7 11 8 9.5 9 8 C10 10 11 11.5 12 11.5 C12.5 8.5 12 6 13 3 Z',
    coeur: {
      duree: '0.5s',
      forme:
        'M11.5 12.5 C12.8 14 14.5 15 14.5 16.8 A2.5 2.5 0 0 1 9.5 16.8 C9.5 15.3 10.5 14.3 11.5 12.5 Z',
    },
  },
  {
    couleur: 'fill-error-1',
    duree: '0.9s',
    decalage: '-0.3s',
    forme:
      'M11 3 C11.5 6 17 8.5 17 13 A5 5 0 0 1 7 13 C7 11 8 9.5 9 8 C10 10 11 11.5 12 11.5 C12 8.5 11 6 11 3 Z',
    coeur: {
      duree: '0.6s',
      forme:
        'M12.5 12.5 C13.5 14 14.5 15 14.5 16.8 A2.5 2.5 0 0 1 9.5 16.8 C9.5 15.3 11.2 14.3 12.5 12.5 Z',
    },
  },
  {
    couleur: 'fill-orange-1',
    duree: '0.8s',
    decalage: '-0.5s',
    forme:
      'M13 3 C13.5 6 17 8.5 17 13 A5 5 0 0 1 7 13 C7 11 8 9.5 9 8 C10 10 11 11.5 12 11.5 C12.5 8.5 12 6 13 3 Z',
    coeur: {
      duree: '0.55s',
      forme:
        'M11.5 12.5 C12.8 14 14.5 15 14.5 16.8 A2.5 2.5 0 0 1 9.5 16.8 C9.5 15.3 10.5 14.3 11.5 12.5 Z',
    },
  },
];

export const BudgetFlamme = ({ seuil }: { seuil: string }) => (
  <span
    role="img"
    aria-label="Budget élevé"
    title={`Budget supérieur à ${seuil}`}
    className="inline-flex items-end"
  >
    {flammes.map(({ couleur, duree, decalage, forme, coeur }, index) => (
      <svg key={index} viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path className={couleur} d={FORME_FLAMME}>
          <animate
            attributeName="d"
            dur={duree}
            begin={decalage}
            repeatCount="indefinite"
            values={oscillation(FORME_FLAMME, forme)}
          />
        </path>
        <path className="fill-secondary-1" d={FORME_COEUR}>
          <animate
            attributeName="d"
            dur={coeur.duree}
            repeatCount="indefinite"
            values={oscillation(FORME_COEUR, coeur.forme)}
          />
        </path>
      </svg>
    ))}
  </span>
);
