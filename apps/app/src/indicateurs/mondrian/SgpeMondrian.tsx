'use client';

import { EpciData, LeverPercentages, MondrianTreemap } from 'mondrian-treemap';
import React from 'react';

export const SgpeMondrian: React.FC = () => {
  const epciData: EpciData = {
    region: 'Auvergne-Rhône-Alpes',
    sectors: [
      {
        name: 'Transports',
        value2019: 509.3,
        target2030: 369.6,
        calculation_method: 'difference_repartition',
      },
      {
        name: 'Résidentiel',
        value2019: 229.7,
        target2030: 132,
        calculation_method: 'difference_repartition',
      },
      {
        name: 'Industrie',
        value2019: 144.1,
        target2030: 71.6,
        calculation_method: 'sum_transposition',
        source_sectors: ['Industrie'],
      },
      {
        name: 'Tertiaire',
        value2019: 138.1,
        target2030: 61.8,
        calculation_method: 'difference_repartition',
      },
      {
        name: 'Agriculture',
        value2019: 32.9,
        target2030: 28.4,
        calculation_method: 'transposition_directe',
      },
      {
        name: 'Déchets',
        value2019: 6.92,
        target2030: 5.05,
        calculation_method: 'difference_repartition',
      },
      {
        name: 'UTCATF',
        value2019: -14.7,
        target2030: -12,
        calculation_method: 'difference_repartition',
      },
    ],
  };

  const leverPercentages: LeverPercentages = {
    sectors: [
      {
        sector_snbc: 'Transports',
        levers: [
          {
            name: 'Réduction des déplacements',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 5,
            },
          },
          {
            name: 'Covoiturage',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 5,
            },
          },
          {
            name: 'Vélo et transport en commun',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 8,
            },
          },
          {
            name: 'Véhicules électriques',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 19,
            },
          },
          {
            name: 'Efficacité véhicules privés',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 10,
            },
          },
          {
            name: 'Bus et cars décarbonés',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 1,
            },
          },
          {
            name: 'Fret décarboné',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 23,
            },
          },
          {
            name: 'Efficacité logistique',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 28,
            },
          },
        ],
      },
      {
        sector_snbc: 'Résidentiel',
        levers: [
          {
            name: 'Changement chaudières fioul',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 43,
            },
          },
          {
            name: 'Changement chaudières gaz',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 32,
            },
          },
          {
            name: 'Sobriété bâtiments',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 25,
            },
          },
        ],
      },
      {
        sector_snbc: 'Tertiaire',
        levers: [
          {
            name: 'Changement chaudière fioul',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 37,
            },
          },
          {
            name: 'Changement chaudière gaz',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 17,
            },
          },
          {
            name: 'Sobriété et isolation',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 45,
            },
          },
        ],
      },
      {
        sector_snbc: 'Industrie',
        levers: [
          {
            name: 'Production industrielle',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 100,
            },
          },
        ],
      },
      {
        sector_snbc: 'Agriculture',
        levers: [
          {
            name: 'Bâtiments & Machines agricoles',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 33.3,
            },
          },
          {
            name: 'Élevage durable',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 33.3,
            },
          },
          {
            name: 'Changements fertilisation',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 33.3,
            },
          },
        ],
      },
      {
        sector_snbc: 'Déchets',
        levers: [
          {
            name: 'Captage méthane ISDND',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 59,
            },
          },
          {
            name: 'Prévention déchets',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 7,
            },
          },
          {
            name: 'Valorisation matière',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 35,
            },
          },
        ],
      },
      {
        sector_snbc: 'UTCATF',
        levers: [
          {
            name: 'Pratiques stockantes',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 34,
            },
          },
          {
            name: 'Gestion des haies',
            regional_percentages: {
              'Auvergne-Rhône-Alpes': 66,
            },
          },
        ],
      },
    ],
  };
  const handleLeverSelected = (
    sector: string,
    lever: string,
    contribution: number
  ) => {
    console.log(`Selected: ${sector} - ${lever} (${contribution} ktCO₂e)`);
  };

  return (
    <MondrianTreemap
      epciData={epciData}
      leverPercentages={leverPercentages}
      onLeverSelected={handleLeverSelected}
      style={{ height: '600px' }}
    />
  );
};
