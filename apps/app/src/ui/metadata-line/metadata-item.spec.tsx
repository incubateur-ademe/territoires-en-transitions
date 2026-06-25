import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { appLabels } from '../../labels/catalog';
import { MetadataItem } from './metadata-item';

describe('MetadataItem — valeur à compléter', () => {
  it('affiche le badge « À compléter » quand la valeur est nulle', () => {
    render(<MetadataItem icon="user-line" label="Pilote" value={null} />);

    expect(screen.getByText(appLabels.aCompleterMaj)).toBeDefined();
  });

  it('affiche le badge « À compléter » quand la valeur est une chaîne vide', () => {
    render(<MetadataItem icon="user-line" label="Pilote" value="" />);

    expect(screen.getByText(appLabels.aCompleterMaj)).toBeDefined();
  });

  it('affiche la valeur et masque le badge quand une valeur est présente', () => {
    render(
      <MetadataItem icon="user-line" label="Pilote" value="Jean Dupont" />
    );

    expect(screen.getByText('Jean Dupont')).toBeDefined();
    expect(screen.queryByText(appLabels.aCompleterMaj)).toBeNull();
  });
});
