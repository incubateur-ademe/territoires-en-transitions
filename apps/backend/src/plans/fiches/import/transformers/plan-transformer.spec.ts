import { parsePlanExcel } from '@/backend/plans/fiches/import/parsers/excel-parser';
import { prioriteEnumSchema } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import * as fs from 'node:fs';
import * as path from 'path';
import { transformToPlan } from './plan-transformer';

const RESOURCES_DIR = path.join(__dirname, '../__fixtures__');

describe('Plan Transformer Tests', () => {
  const readExcelFile = (filename: string): string => {
    const filePath = path.join(RESOURCES_DIR, filename);
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  };

  describe('Valid Plan File', () => {
    it('should successfully transform a valid plan Excel file', async () => {
      const fileContent = readExcelFile('plan_ok.xlsx');
      const result = await parsePlanExcel(fileContent);
      expect(result.success).toBe(true);
      if (result.success) {
        const data = await transformToPlan(result.data, 'test', 1, [], []);
        expect(data.success).toBe(true);
        if (data.success) {
          expect(data.data.nom).toBe('test');
          expect(data.data.typeId).toBe(1);
          expect(data.data.pilotes).toEqual([]);
          expect(data.data.referents).toEqual([]);
          expect(data.data.fiches.length).toBe(1);
          expect(data.data.fiches[0]).toEqual({
            axisPath: [
              'Axe 1. COORDINATION DU CLS - AXE TRANSVERSAL',
              'Objectif stratégique 1. Impulser une dynamique participative',
              'Sous-Sous Axe',
            ],
            actions: undefined,
            effetsAttendus: [],
            ameliorationContinue: undefined,
            annexes: undefined,
            budget: 5000000,
            calendrier: undefined,
            dateDebut: new Date('2025-12-01T00:00:00.000Z'),
            dateFin: new Date('2030-09-01T00:00:00.000Z'),
            description:
              'Il s’agit alors de permettre aux élus communautaires d’à la fois porter la parole des habitants dans le cadre du CLS mais aussi de pouvoir suivre l’avancée des actions et de se tenir informé de toute son actualité.',
            etapes: undefined,
            fiches: undefined,
            financements: 'BPI',
            financeurs: [
              {
                montant: 1000,
                nom: 'John Doe',
              },
              {
                montant: 25000,
                nom: 'Bernard',
              },
              {
                montant: 666,
                nom: 'François',
              },
            ],
            indicateurs: undefined,
            instanceGouvernance: 'Une instance de gouvernance',
            notesComplementaire: undefined,
            notesSuivi: undefined,
            objectifs: `Objectif général : L’appropriation du Contrat Local de Santé par les élus
Objectif spécifique n°1 : Désigner les élus à intégrer la commission de suivi du CLS (Maire de communes avec une dynamique Santé)
Objectif opérationnel 1.1 : Sensibiliser les élus à la dynamique du CLS
Objectif opérationnel 1.2 : Interroger sur la place et les attendus du CLS auprès de chaque élu (sondage)
Objectif spécifique n°2 : Définir avec la Commission les règles de fonctionnement 
Objectif opérationnel 2.1 : Définir la participation (volontariat ou non), la durée du « mandat » et le rythme
Objectif opérationnel 2.2 : Définir les attendus : commission consultative (les remontées d’information des habitants) ou participative (avec des propositions pouvant alimenter les actions) et les outils à disposition.
Objectif spécifique n°3 : Faciliter les actions du CLS
Objectif opérationnel 3.1 : Evaluer le CLS avec la commission d’élus communautaires`,
            partenaires: ['Giga partenaire'],
            participation: 'co-construction',
            pilotes: ['Sophie AMOUROUS'],
            priorite: prioriteEnumSchema.Enum['Élevé'],
            resources: 'Moyen humain très humain',
            services: ['COM L1', 'Contrat Local de Santé'],
            status: 'À venir',
            structures: ['Contrat Local de Santé'],
            titre:
              "Action 1. Création d'un comité de suivi d'élus autour du CLS",
            thematiques: [],
            sousThematiques: [],
            referents: ['Emmanuelle Volte', 'Arnault bis'],
          });
        }
      }
    });
  });
});
