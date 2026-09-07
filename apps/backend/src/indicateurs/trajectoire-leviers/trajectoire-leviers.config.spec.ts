import { LEVIER_SECTEURS, levierEnumValues } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { TRAJECTOIRE_LEVIERS_CONFIGURATION } from './trajectoire-leviers.config';

describe('TRAJECTOIRE_LEVIERS_CONFIGURATION', () => {
  it('couvre exactement le référentiel partagé, sans doublon ni manquant', () => {
    const configuredLeviers =
      TRAJECTOIRE_LEVIERS_CONFIGURATION.secteurs.flatMap((secteur) =>
        secteur.leviers.map((levier) => levier.nom)
      );

    expect(configuredLeviers.sort()).toEqual([...levierEnumValues].sort());
  });

  it('rattache chaque levier au secteur que le référentiel partagé lui donne', () => {
    const configuredSecteurs = Object.fromEntries(
      TRAJECTOIRE_LEVIERS_CONFIGURATION.secteurs.flatMap((secteur) =>
        secteur.leviers.map((levier) => [levier.nom, secteur.nom])
      )
    );

    expect(configuredSecteurs).toEqual(LEVIER_SECTEURS);
  });

  it('expose les secteurs et leurs leviers dans un ordre stable', () => {
    const structure = TRAJECTOIRE_LEVIERS_CONFIGURATION.secteurs.map(
      (secteur) => ({
        nom: secteur.nom,
        identifiants: secteur.identifiants,
        leviers: secteur.leviers.map((levier) => levier.nom),
      })
    );

    expect(structure).toEqual([
      {
        nom: 'Résidentiel',
        identifiants: ['cae_1.c'],
        leviers: [
          'Changement chaudières fioul + rénovation (résidentiel)',
          'Changement chaudières gaz + rénovation (résidentiel)',
          'Sobriété des bâtiments (résidentiel)',
        ],
      },
      {
        nom: 'Tertiaire',
        identifiants: ['cae_1.d'],
        leviers: [
          'Changement de chaudière à fioul (tertiaire)',
          'Changement de chaudière à gaz (tertiaire)',
          'Sobriété et isolation des bâtiments (tertiaire)',
        ],
      },
      {
        nom: 'Transports',
        identifiants: ['cae_1.k'],
        leviers: [
          'Réduction des déplacements',
          'Covoiturage',
          'Vélo et transport en commun',
          'Véhicules électriques',
          'Efficacité et carburants décarbonés des véhicules privés',
          'Bus et cars décarbonés',
          'Fret décarboné et multimodalité',
          'Efficacité et sobriété logistique',
        ],
      },
      {
        nom: 'Agriculture',
        identifiants: ['cae_1.g'],
        leviers: [
          'Bâtiments & Machines agricoles',
          'Elevage durable',
          'Changements de pratiques de fertilisation azotée',
        ],
      },
      {
        nom: 'UTCATF',
        identifiants: ['cae_63.a'],
        leviers: [
          'Gestion des forêts et produits bois',
          'Pratiques stockantes',
          'Gestion des haies',
          'Gestion des prairies',
          'Sobriété foncière',
        ],
      },
      {
        nom: 'Industrie',
        identifiants: ['cae_1.i', 'cae_1.csc'],
        leviers: ['Production industrielle'],
      },
      {
        nom: 'Déchets',
        identifiants: ['cae_1.h'],
        leviers: [
          'Captage de méthane dans les ISDND',
          'Prévention des déchets',
          'Valorisation matière des déchets',
        ],
      },
      {
        nom: 'Branche énergie',
        identifiants: ['cae_1.j'],
        leviers: [
          'Electricité renouvelable',
          'Biogaz',
          'Réseaux de chaleur décarbonés',
        ],
      },
    ]);
  });
});
