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
        isTrajectoireNotAvailable: false,
        isRegionNotSupported: false,
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
        isTrajectoireNotAvailable: false,
        isRegionNotSupported: false,
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
        isTrajectoireNotAvailable: false,
        isRegionNotSupported: false,
        isCollectiviteNotEpci: false,
      })
    ).toBe('notComputed');
  });

  it('reconnaît une trajectoire SNBC 3 non disponible', () => {
    expect(
      toTrajectoireState({
        hasTrajectoire: false,
        isLoadingError: true,
        isTrajectoireNotComputed: false,
        isTrajectoireNotAvailable: true,
        isRegionNotSupported: false,
        isCollectiviteNotEpci: false,
      })
    ).toBe('notAvailable');
  });

  it('reconnaît un EPCI des DROM, sans leviers SGPE', () => {
    expect(
      toTrajectoireState({
        hasTrajectoire: false,
        isLoadingError: true,
        isTrajectoireNotComputed: false,
        isTrajectoireNotAvailable: false,
        isRegionNotSupported: true,
        isCollectiviteNotEpci: false,
      })
    ).toBe('regionNotSupported');
  });

  it('reconnaît une collectivité qui n’est pas un EPCI', () => {
    expect(
      toTrajectoireState({
        hasTrajectoire: false,
        isLoadingError: true,
        isTrajectoireNotComputed: false,
        isTrajectoireNotAvailable: false,
        isRegionNotSupported: false,
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
        isTrajectoireNotAvailable: false,
        isRegionNotSupported: false,
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

  it('signale une trajectoire SNBC 3 non disponible, même quand des actions existent', () => {
    expect(
      toPriorisationAccess({
        hasMobilisation: true,
        trajectoireState: 'notAvailable',
      })
    ).toBe('trajectoireNotAvailable');
  });

  it('signale les leviers SGPE indisponibles en outre-mer, même quand des actions existent', () => {
    expect(
      toPriorisationAccess({
        hasMobilisation: true,
        trajectoireState: 'regionNotSupported',
      })
    ).toBe('regionNotSupported');
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
