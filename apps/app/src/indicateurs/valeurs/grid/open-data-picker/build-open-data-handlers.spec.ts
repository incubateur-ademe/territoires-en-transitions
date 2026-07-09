import { describe, expect, it, vi } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { buildOpenDataHandlers } from './build-open-data-handlers';
import { ColumnSelection } from './open-data-picker';
import { OpenDataSource, toIndicateurId, toSourceId, toYear } from '../types';

const baseArgs = () => ({
  indicateurId: toIndicateurId(1),
  year: toYear(2030),
  close: vi.fn(),
  notify: vi.fn(),
  selectOpenData: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
  clearCell: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
});

const source: OpenDataSource = {
  sourceId: toSourceId('citepa'),
  libelle: 'CITEPA',
  value: 100,
  methodologie: null,
  dateVersion: '2026-01-01',
};

describe('buildOpenDataHandlers', () => {
  it('ferme apres une selection open data reussie', async () => {
    const args = baseArgs();
    await buildOpenDataHandlers(args).onSelect(toSourceId('citepa'));

    expect(args.close).toHaveBeenCalledTimes(1);
    expect(args.notify).not.toHaveBeenCalled();
  });

  it('notifie l echec et ne ferme pas quand la selection open data echoue', async () => {
    const args = { ...baseArgs(), selectOpenData: vi.fn().mockResolvedValue({ ok: false }) };
    await buildOpenDataHandlers(args).onSelect(toSourceId('citepa'));

    expect(args.notify).toHaveBeenCalledWith(
      appLabels.indicateurSelectionnerValeurEchec,
      'error'
    );
    expect(args.close).not.toHaveBeenCalled();
  });

  it('ferme apres un retour en saisie manuelle reussi', async () => {
    const args = baseArgs();
    await buildOpenDataHandlers(args).onReset();

    expect(args.close).toHaveBeenCalledTimes(1);
    expect(args.notify).not.toHaveBeenCalled();
  });

  it('notifie l echec et ne ferme pas quand le retour en saisie manuelle echoue', async () => {
    const args = { ...baseArgs(), clearCell: vi.fn().mockResolvedValue({ ok: false }) };
    await buildOpenDataHandlers(args).onReset();

    expect(args.notify).toHaveBeenCalledWith(
      appLabels.indicateurRepasserSaisieEchec,
      'error'
    );
    expect(args.close).not.toHaveBeenCalled();
  });

  it('notifie et rend false quand la selection de colonne n aboutit pas', async () => {
    const columnSelection: ColumnSelection = {
      source,
      count: 3,
      onSelect: vi.fn().mockResolvedValue(false),
    };
    const args = { ...baseArgs(), columnSelection };
    const handlers = buildOpenDataHandlers(args);

    expect(await handlers.columnSelection?.onSelect()).toBe(false);
    expect(args.notify).toHaveBeenCalledWith(
      appLabels.indicateurSelectionnerValeurEchec,
      'error'
    );
    expect(args.close).not.toHaveBeenCalled();
  });

  it('ferme quand la selection de colonne aboutit', async () => {
    const columnSelection: ColumnSelection = {
      source,
      count: 3,
      onSelect: vi.fn().mockResolvedValue(true),
    };
    const args = { ...baseArgs(), columnSelection };
    const handlers = buildOpenDataHandlers(args);

    expect(await handlers.columnSelection?.onSelect()).toBe(true);
    expect(args.close).toHaveBeenCalledTimes(1);
  });

  it('laisse columnSelection undefined quand aucune n est fournie', () => {
    expect(buildOpenDataHandlers(baseArgs()).columnSelection).toBeUndefined();
  });
});
