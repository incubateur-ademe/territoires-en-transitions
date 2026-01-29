import {
  Body,
  Container,
  Html,
  Img,
  Tailwind,
  pixelBasedPreset,
} from '@react-email/components';
import { preset } from '@tet/domain/utils';
import { toMerged } from 'es-toolkit';
import * as React from 'react';

// Pas idéal mais impossible d'injecter des données dans le template en dehors des props.
// Or on veut le même header sur tous les emails de notification et éviter de devoir
// dans chaque template de notification lire une URL par exemple depuis l'env. avec
// `configurationService.get('APP_URL')`
const URL_BANNIERE = `${process.env.APP_URL}/email-header.jpg`;

/**
 * Génère l'enveloppe globale du mail avec
 * - la config pour utiliser tailwind (config react-email + couleurs de notre thème)
 * - un fond blanc sur un encadré gris
 * - un en-tête graphique (similaire aux mails transactionnels)
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
          <Container className="bg-white px-8 py-4">
            <Img src={URL_BANNIERE} alt="BanniereTET" width="100%" />
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
