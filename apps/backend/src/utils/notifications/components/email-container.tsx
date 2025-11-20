import {
  Body,
  Container,
  Html,
  Tailwind,
  pixelBasedPreset,
} from '@react-email/components';
import { toMerged } from 'es-toolkit';
import * as React from 'react';
import { preset } from './preset';

/**
 * Génère l'enveloppe globale du mail avec
 * - la config pour utiliser tailwind (config react-email + couleurs de notre thème)
 * - un fond blanc sur un encadré gris
 */
export const EmailContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Html>
      <Tailwind
        config={toMerged(pixelBasedPreset, {
          presets: [preset],
        })}
      >
        <Body className="bg-grey-2 text-grey-10 font-sans text-sm">
          <Container className="bg-white px-8 py-4">{children}</Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
