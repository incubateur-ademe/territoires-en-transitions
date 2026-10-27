import { Badge } from '@tet/ui';
import { IndicateurLie } from '../fixtures';

/**
 * Proposition : nouveau composant
 * Besoin : un petit tableau de lecture (nom, trois valeurs chiffrées, badge de
 * tendance) à lignes denses ; les tables du design system sont des tables de
 * données éditables (tri, colonnes, cellules riches), trop lourdes ici.
 * Espacement hors échelle : cellules à 12px de padding (entre `sm` 8px et
 * `md` 16px).
 */
const enTete =
  'border-b border-grey-3 bg-grey-2 px-3 py-2 font-bold text-primary-9';
const cellule = 'border-b border-grey-3 px-3 py-3 tabular-nums';

export const IndicatorsTable = ({
  indicateurs,
}: {
  indicateurs: ReadonlyArray<IndicateurLie>;
}) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-left text-sm font-normal">
      <thead>
        <tr>
          <th scope="col" className={enTete}>
            Indicateur
          </th>
          <th scope="col" className={`${enTete} text-right`}>
            2019
          </th>
          <th scope="col" className={`${enTete} text-right`}>
            2025
          </th>
          <th scope="col" className={`${enTete} text-right`}>
            Objectif 2030
          </th>
          <th scope="col" className={enTete}>
            Tendance
          </th>
        </tr>
      </thead>
      <tbody>
        {indicateurs.map((indicateur) => (
          <tr key={indicateur.nom}>
            <td className="border-b border-grey-3 px-3 py-3">
              <a href="#" className="text-primary-7 hover:text-primary-8">
                {indicateur.nom}
              </a>
            </td>
            <td className={`${cellule} text-right`}>{indicateur.reference}</td>
            <td className={`${cellule} text-right font-bold`}>
              {indicateur.actuel}
            </td>
            <td className={`${cellule} text-right`}>{indicateur.objectif}</td>
            <td className="border-b border-grey-3 px-3 py-3">
              <Badge
                title={indicateur.tendance}
                variant={indicateur.variante}
                size="sm"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
