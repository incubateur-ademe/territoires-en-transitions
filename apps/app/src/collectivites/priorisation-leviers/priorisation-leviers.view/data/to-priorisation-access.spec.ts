import { describe, expect, it } from 'vitest';
import {
  toPriorisationAccess,
  toTrajectoireState,
} from './to-priorisation-access';

describe('toTrajectoireState', () => {
  it('considère la trajectoire calculée dès que ses données sont là', () => {
    expect(
      toTrajectoireState({
        hasTrajectoire: true,
        isLoadingError: false,
        isTrajectoireNotComputed: false,
        isCollectiviteNotEpci: false,
      })
    ).toBe('computed');
  });

  it('attend tant que la requête ne s’est pas soldée', () => {
    expect(
      toTrajectoireState({
        hasTrajectoire: false,
        isLoadingError: false,
        isTrajectoireNotComputed: false,
        isCollectiviteNotEpci: false,
      })
    ).toBe('loading');
  });

  it('reconnaît une trajectoire non calculée', () => {
    expect(
      toTrajectoireState({
        hasTrajectoire: false,
        isLoadingError: true,
        isTrajectoireNotComputed: true,
        isCollectiviteNotEpci: false,
      })
    ).toBe('notComputed');
  });

  it('reconnaît une collectivité qui n’est pas un EPCI', () => {
    expect(
      toTrajectoireState({
        hasTrajectoire: false,
        isLoadingError: true,
        isTrajectoireNotComputed: false,
        isCollectiviteNotEpci: true,
      })
    ).toBe('reservedToEpci');
  });

  it('traite toute autre erreur comme un échec à réessayer', () => {
    expect(
      toTrajectoireState({
        hasTrajectoire: false,
        isLoadingError: true,
        isTrajectoireNotComputed: false,
        isCollectiviteNotEpci: false,
      })
    ).toBe('failed');
  });
});

describe('toPriorisationAccess', () => {
  it('réserve la vue aux EPCI avant toute autre condition', () => {
    expect(
      toPriorisationAccess({
        hasMobilisation: false,
        trajectoireState: 'reservedToEpci',
      })
    ).toBe('reservedToEpci');
  });

  it('demande la trajectoire SNBC avant les actions quand les deux manquent', () => {
    expect(
      toPriorisationAccess({
        hasMobilisation: false,
        trajectoireState: 'notComputed',
      })
    ).toBe('missingTrajectoire');
  });

  it('demande la trajectoire SNBC même quand des actions existent', () => {
    expect(
      toPriorisationAccess({
        hasMobilisation: true,
        trajectoireState: 'notComputed',
      })
    ).toBe('missingTrajectoire');
  });

  it('demande des actions quand seule la trajectoire est calculée', () => {
    expect(
      toPriorisationAccess({
        hasMobilisation: false,
        trajectoireState: 'computed',
      })
    ).toBe('missingActions');
  });

  it('ouvre la vue quand la trajectoire est calculée et des actions existent', () => {
    expect(
      toPriorisationAccess({
        hasMobilisation: true,
        trajectoireState: 'computed',
      })
    ).toBe('open');
  });
});
