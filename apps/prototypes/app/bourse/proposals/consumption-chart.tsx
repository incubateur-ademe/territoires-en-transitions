/**
 * Proposition : nouveau composant
 * Besoin : un histogramme annuel avec une trajectoire cible en pointillés ;
 * le design system n'a aucun composant de graphique.
 */
type Consommation = Readonly<{ annee: number; mwh: number }>;

const largeur = 660;
const hauteurMax = 180;
const base = 210;
const echelleMax = 9000;
const pas = 50;
const demiBarre = 14;
const origineX = 64;

const x = (annee: number, premiereAnnee: number): number =>
  origineX + pas * (annee - premiereAnnee);
const y = (mwh: number): number => base - (mwh / echelleMax) * hauteurMax;
const formater = (mwh: number): string => mwh.toLocaleString('fr-FR');

const graduations = [0, 3000, 6000, 9000] as const;

export const ConsumptionChart = ({
  resultats,
  objectif,
  label,
}: {
  resultats: ReadonlyArray<Consommation>;
  objectif: Readonly<{ annee: number; mwh: number }>;
  label: string;
}) => {
  const premiere = resultats[0];
  const derniere = resultats[resultats.length - 1];
  const anneesAffichees = [
    ...resultats
      .map(({ annee }) => annee)
      .filter((a) => (a - premiere.annee) % 2 === 0),
    objectif.annee,
  ];

  return (
    <svg
      viewBox={`0 0 ${largeur} 240`}
      width="100%"
      role="img"
      aria-label={label}
      className="text-xs"
    >
      {graduations.map((g) => (
        <g key={g}>
          <line
            x1={40}
            x2={640}
            y1={y(g)}
            y2={y(g)}
            className="stroke-grey-3"
          />
          <text x={34} y={y(g) + 4} textAnchor="end" className="fill-grey-8">
            {formater(g)}
          </text>
        </g>
      ))}
      {resultats.map(({ annee, mwh }) => (
        <rect
          key={annee}
          x={x(annee, premiere.annee) - demiBarre}
          y={y(mwh)}
          width={demiBarre * 2}
          height={base - y(mwh)}
          rx={4}
          className="fill-primary-7"
        />
      ))}
      <line
        x1={x(premiere.annee, premiere.annee)}
        y1={y(premiere.mwh)}
        x2={x(objectif.annee, premiere.annee)}
        y2={y(objectif.mwh)}
        strokeWidth={2}
        strokeDasharray="6 4"
        className="stroke-primary-9"
      />
      <circle
        cx={x(objectif.annee, premiere.annee)}
        cy={y(objectif.mwh)}
        r={5}
        className="fill-primary-9"
      />
      <text
        x={x(objectif.annee, premiere.annee)}
        y={y(objectif.mwh) - 12}
        textAnchor="middle"
        className="fill-primary-9 font-bold"
      >
        {formater(objectif.mwh)}
      </text>
      <text
        x={x(derniere.annee, premiere.annee)}
        y={y(derniere.mwh) - 9}
        textAnchor="middle"
        className="fill-primary-10 font-bold"
      >
        {formater(derniere.mwh)}
      </text>
      {anneesAffichees.map((annee) => (
        <text
          key={annee}
          x={x(annee, premiere.annee)}
          y={228}
          textAnchor="middle"
          className="fill-grey-8"
        >
          {annee}
        </text>
      ))}
    </svg>
  );
};
