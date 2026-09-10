import { describe, expect, it } from 'vitest';
import { DemarchePcaetStatusEnum } from './demarche-pcaet-status.enum.schema';
import { PcaetAvisAuTitreDeEnum } from './pcaet-avis-au-titre-de.enum.schema';
import {
  getStatutInstruction,
  PcaetStatutInstructionEnum,
  pcaetStatutInstructionValues,
  STATUTS_INSTRUCTION_PAR_DEFAUT,
  type StatutInstructionEntree,
} from './pcaet-statut-instruction.rules';

const now = new Date('2026-08-11T10:00:00.000Z');
const echeanceAVenir = '2026-10-25T00:00:00.000Z';
const echeancePassee = '2026-07-12T00:00:00.000Z';

/** Une saisine transmise, vue par une DREAL qui se prononce, rien encore rendu. */
const transmise: StatutInstructionEntree = {
  demarcheStatus: DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
  avisDeadlineAt: echeanceAVenir,
  aUnPcaetAbouti: false,
  deposeAvis: true,
  nbAvisValides: 0,
  nbAvisBrouillons: 0,
  achevement: [],
};

describe('getStatutInstruction — en amont de la transmission', () => {
  it('aucune démarche : aucun dépôt', () => {
    expect(
      getStatutInstruction({ ...transmise, demarcheStatus: null }, now)
    ).toBe(PcaetStatutInstructionEnum.AUCUN_DEPOT);
  });

  it('premier dépôt en cours : en élaboration', () => {
    expect(
      getStatutInstruction(
        {
          ...transmise,
          demarcheStatus: DemarchePcaetStatusEnum.EN_ELABORATION,
          avisDeadlineAt: null,
        },
        now
      )
    ).toBe(PcaetStatutInstructionEnum.EN_ELABORATION);
  });

  it('dépôt en cours après un PCAET abouti : en révision', () => {
    expect(
      getStatutInstruction(
        {
          ...transmise,
          demarcheStatus: DemarchePcaetStatusEnum.EN_ELABORATION,
          avisDeadlineAt: null,
          aUnPcaetAbouti: true,
        },
        now
      )
    ).toBe(PcaetStatutInstructionEnum.EN_REVISION);
  });

  it('un dépôt encore en chantier n’emprunte rien aux règles d’avis', () => {
    // Échéance passée et aucun avis : « pas d'avis déposé » serait absurde sur
    // un dossier qui n'a jamais été transmis.
    expect(
      getStatutInstruction(
        {
          ...transmise,
          demarcheStatus: DemarchePcaetStatusEnum.EN_ELABORATION,
          avisDeadlineAt: echeancePassee,
        },
        now
      )
    ).toBe(PcaetStatutInstructionEnum.EN_ELABORATION);
  });
});

describe('getStatutInstruction — un service qui se prononce', () => {
  it('rien de déposé, fenêtre ouverte : à instruire', () => {
    expect(getStatutInstruction(transmise, now)).toBe(
      PcaetStatutInstructionEnum.A_INSTRUIRE
    );
  });

  it('un brouillon en attente : brouillon en cours', () => {
    expect(
      getStatutInstruction({ ...transmise, nbAvisBrouillons: 1 }, now)
    ).toBe(PcaetStatutInstructionEnum.BROUILLON_EN_COURS);
  });

  it('un avis validé : instruit', () => {
    expect(getStatutInstruction({ ...transmise, nbAvisValides: 1 }, now)).toBe(
      PcaetStatutInstructionEnum.INSTRUIT
    );
  });

  it('échéance passée sans avis validé : pas d’avis déposé', () => {
    expect(
      getStatutInstruction(
        { ...transmise, avisDeadlineAt: echeancePassee },
        now
      )
    ).toBe(PcaetStatutInstructionEnum.PAS_D_AVIS_DEPOSE);
  });
});

describe('getStatutInstruction — un destinataire en lecture', () => {
  const enLecture: StatutInstructionEntree = {
    ...transmise,
    deposeAvis: false,
  };

  it('le dossier avance sans lui : à instruire', () => {
    expect(getStatutInstruction(enLecture, now)).toBe(
      PcaetStatutInstructionEnum.A_INSTRUIRE
    );
  });

  it('son délai passé ne rend pas le dossier fautif', () => {
    // Une DDT n'a aucun avis à rendre : son échéance échue ne doit pas se lire
    // « pas d'avis déposé » alors que les instances saisies ont conclu.
    expect(
      getStatutInstruction(
        {
          ...enLecture,
          avisDeadlineAt: echeancePassee,
          achevement: [
            {
              titresAttendus: [PcaetAvisAuTitreDeEnum.PREFET_REGION],
              titresValides: [PcaetAvisAuTitreDeEnum.PREFET_REGION],
            },
          ],
        },
        now
      )
    ).toBe(PcaetStatutInstructionEnum.INSTRUIT);
  });

  it('ses propres compteurs d’avis ne comptent pas', () => {
    // `nbAvisValides` porte sur *sa* demande, qui restera vide par nature.
    expect(
      getStatutInstruction({ ...enLecture, nbAvisValides: 1 }, now)
    ).toBe(PcaetStatutInstructionEnum.A_INSTRUIRE);
  });
});

describe('getStatutInstruction — en aval', () => {
  it('publié : adopté', () => {
    expect(
      getStatutInstruction(
        { ...transmise, demarcheStatus: DemarchePcaetStatusEnum.PUBLIE },
        now
      )
    ).toBe(PcaetStatutInstructionEnum.ADOPTE);
  });

  it('archivé : archivé', () => {
    expect(
      getStatutInstruction(
        { ...transmise, demarcheStatus: DemarchePcaetStatusEnum.ARCHIVE },
        now
      )
    ).toBe(PcaetStatutInstructionEnum.ARCHIVE);
  });

  it.each([
    [DemarchePcaetStatusEnum.PUBLIE, PcaetStatutInstructionEnum.ADOPTE],
    [DemarchePcaetStatusEnum.ARCHIVE, PcaetStatutInstructionEnum.ARCHIVE],
  ])(
    'un dossier abouti se lit pareil qu’on y dépose ou non : %s',
    (status, attendu) => {
      // `clos` est la seule valeur de l'état de saisine sans équivalent
      // affiché : publié et archivé sont interceptés avant d'interroger les
      // règles d'avis, et le résultat ne dépend donc plus de `deposeAvis`.
      for (const deposeAvis of [true, false]) {
        expect(
          getStatutInstruction(
            { ...transmise, demarcheStatus: status, deposeAvis },
            now
          )
        ).toBe(attendu);
      }
    }
  );

  it('instruit sans avis rendu reste lisible', () => {
    expect(
      getStatutInstruction(
        {
          ...transmise,
          demarcheStatus: DemarchePcaetStatusEnum.INSTRUIT,
          avisDeadlineAt: echeancePassee,
        },
        now
      )
    ).toBe(PcaetStatutInstructionEnum.PAS_D_AVIS_DEPOSE);
  });
});

describe('STATUTS_INSTRUCTION_PAR_DEFAUT', () => {
  it('écarte exactement les trois statuts que le filtre vient d’ouvrir', () => {
    const exclus = pcaetStatutInstructionValues.filter(
      (statut) =>
        !(STATUTS_INSTRUCTION_PAR_DEFAUT as readonly string[]).includes(statut)
    );
    expect(exclus).toEqual([
      PcaetStatutInstructionEnum.AUCUN_DEPOT,
      PcaetStatutInstructionEnum.EN_ELABORATION,
      PcaetStatutInstructionEnum.EN_REVISION,
      PcaetStatutInstructionEnum.ARCHIVE,
    ]);
  });
});
