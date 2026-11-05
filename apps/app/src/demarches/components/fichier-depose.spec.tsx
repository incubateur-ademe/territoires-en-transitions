import { appLabels } from '@/app/labels/catalog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { FichierDepose } from './fichier-depose';

describe('FichierDepose', () => {
  test('rend le nom du fichier dans un bouton de téléchargement', () => {
    const onDownload = vi.fn();
    render(
      <FichierDepose
        fichier={{ filename: 'diagnostic.pdf', filesize: 34 }}
        onDownload={onDownload}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'diagnostic.pdf' }));
    expect(onDownload).toHaveBeenCalledOnce();
  });

  test('signale un fichier absent du stockage, sans téléchargement', () => {
    render(
      <FichierDepose
        fichier={{ filename: 'diagnostic.pdf', filesize: null }}
        onDownload={vi.fn()}
      />
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('diagnostic.pdf')).toBeTruthy();
    expect(screen.getByText(appLabels.fichierIndisponible)).toBeTruthy();
  });
});
