import type {
  DemarchePcaetExportTransition,
  DemarchePcaetExportType,
} from '../../shared/models/demarche-pcaet-export.table';
import {
  resolveDemarchePcaetExportSources,
  type DemarchePcaetExportSnapshotRow,
} from './resolve-demarche-pcaet-exports.rules';

const row = (
  transition: DemarchePcaetExportTransition,
  type: DemarchePcaetExportType,
  createdAt: string
): DemarchePcaetExportSnapshotRow => ({
  transition,
  type,
  createdAt,
  storagePath: `1/${transition}/${type}.xlsx`,
  filename: `${transition}-${type}.xlsx`,
});

const TRANSMISSION = '2026-10-01T10:00:00+00:00';
const PUBLICATION = '2026-11-01T10:00:00+00:00';

describe('resolveDemarchePcaetExportSources', () => {
  it('ne sert rien pour un dépôt en élaboration', () => {
    expect(
      resolveDemarchePcaetExportSources({
        status: 'en_elaboration',
        rows: [],
        lectureSeule: false,
      })
    ).toEqual({ source: 'none' });
  });

  it.each([
    'transmis_pour_avis',
    'instruit',
    'instruit_hors_plateforme',
    'publie',
  ] as const)("sert l'export du jour sans export figé (%s)", (status) => {
    expect(
      resolveDemarchePcaetExportSources({
        status,
        rows: [],
        lectureSeule: false,
      })
    ).toEqual({ source: 'on_demand' });
  });

  it("sert l'export figé de la dernière transition", () => {
    const rows = [
      row('transmettre_pour_avis', 'plan', TRANSMISSION),
      row('transmettre_pour_avis', 'indicateurs', TRANSMISSION),
      row('publier', 'plan', PUBLICATION),
      row('publier', 'indicateurs', PUBLICATION),
    ];
    const result = resolveDemarchePcaetExportSources({
      status: 'publie',
      rows,
      lectureSeule: false,
    });
    expect(result).toEqual({
      source: 'snapshot',
      transition: 'publier',
      rows: { plan: rows[2], indicateurs: rows[3] },
    });
  });

  it("à date égale, la publication l'emporte sur la transmission", () => {
    const publication = row('publier', 'plan', TRANSMISSION);
    const transmission = row('transmettre_pour_avis', 'plan', TRANSMISSION);
    // Les deux ordres : un comparateur qui rendrait zéro garderait la première.
    for (const rows of [
      [publication, transmission],
      [transmission, publication],
    ]) {
      expect(
        resolveDemarchePcaetExportSources({
          status: 'publie',
          rows,
          lectureSeule: false,
        })
      ).toMatchObject({ source: 'snapshot', transition: 'publier' });
    }
  });

  it("ne complète jamais un export figé par l'export du jour ni par un export figé plus ancien", () => {
    const rows = [
      row('transmettre_pour_avis', 'plan', TRANSMISSION),
      row('transmettre_pour_avis', 'indicateurs', TRANSMISSION),
      row('publier', 'plan', PUBLICATION),
    ];
    expect(
      resolveDemarchePcaetExportSources({
        status: 'publie',
        rows,
        lectureSeule: false,
      })
    ).toEqual({
      source: 'snapshot',
      transition: 'publier',
      rows: { plan: rows[2], indicateurs: null },
    });
  });

  describe('lecture seule (EPCI couvert)', () => {
    it('sert le plan sans fiche restreinte quand il existe', () => {
      const rows = [
        row('transmettre_pour_avis', 'plan', TRANSMISSION),
        row('transmettre_pour_avis', 'plan_expurge', TRANSMISSION),
      ];
      expect(
        resolveDemarchePcaetExportSources({
          status: 'transmis_pour_avis',
          rows,
          lectureSeule: true,
        })
      ).toMatchObject({ rows: { plan: rows[1] } });
    });

    it("se replie sur le plan de la même transition, pas sur la variante d'une plus ancienne", () => {
      const rows = [
        row('transmettre_pour_avis', 'plan', TRANSMISSION),
        row('transmettre_pour_avis', 'plan_expurge', TRANSMISSION),
        row('publier', 'plan', PUBLICATION),
      ];
      expect(
        resolveDemarchePcaetExportSources({
          status: 'publie',
          rows,
          lectureSeule: true,
        })
      ).toMatchObject({ transition: 'publier', rows: { plan: rows[2] } });
    });

    it('les autres lecteurs reçoivent le plan complet', () => {
      const rows = [
        row('transmettre_pour_avis', 'plan', TRANSMISSION),
        row('transmettre_pour_avis', 'plan_expurge', TRANSMISSION),
      ];
      expect(
        resolveDemarchePcaetExportSources({
          status: 'transmis_pour_avis',
          rows,
          lectureSeule: false,
        })
      ).toMatchObject({ rows: { plan: rows[0] } });
    });
  });
});
