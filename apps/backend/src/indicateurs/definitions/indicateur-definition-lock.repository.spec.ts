import { describe, expect, it, vi } from 'vitest';
import { IndicateurDefinitionLockRepository } from './indicateur-definition-lock.repository';

describe('IndicateurDefinitionLockRepository', () => {
  it('verrouille et relit les définitions dans un ordre déterministe', async () => {
    const lockedDefinitions = [
      { id: 2, periodicite: 'mensuelle', precision: 2 },
      { id: 10, periodicite: 'annuelle', precision: 0 },
    ];
    const forLock = vi.fn().mockResolvedValue(lockedDefinitions);
    const orderBy = vi.fn(() => ({ for: forLock }));
    const where = vi.fn(() => ({ orderBy }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    const execute = vi.fn().mockResolvedValue(undefined);
    const repository = new IndicateurDefinitionLockRepository();

    await expect(
      repository.lockDefinitions([10, 2, 10], { execute, select } as never)
    ).resolves.toEqual(lockedDefinitions);
    expect(execute).toHaveBeenCalledOnce();
    expect(execute.mock.invocationCallOrder[0]).toBeLessThan(
      select.mock.invocationCallOrder[0]
    );
    expect(select).toHaveBeenCalledWith();
    expect(orderBy).toHaveBeenCalledOnce();
    expect(forLock).toHaveBeenCalledWith('share');
  });

  it('évite une requête lorsque la liste est vide', async () => {
    const select = vi.fn();
    const execute = vi.fn().mockResolvedValue(undefined);
    const repository = new IndicateurDefinitionLockRepository();

    await expect(
      repository.lockDefinitions([], { execute, select } as never)
    ).resolves.toEqual([]);
    expect(execute).toHaveBeenCalledOnce();
    expect(select).not.toHaveBeenCalled();
  });

  it('prend un verrou exclusif avant une mutation du graphe', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const repository = new IndicateurDefinitionLockRepository();

    await repository.lockForDefinitionMutation({ execute } as never);

    expect(execute).toHaveBeenCalledOnce();
  });
});
