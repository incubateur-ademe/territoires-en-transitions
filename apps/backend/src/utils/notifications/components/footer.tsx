import { Container, Hr, Link, Text } from '@react-email/components';
import * as React from 'react';

type FooterProps = {
  toEmail: string;
  unsubscribeUrl?: string;
};

export const Footer = ({
  toEmail,
  unsubscribeUrl,
}: FooterProps): React.ReactNode => (
  <>
    <Hr className="border-grey-3 my-4" />
    <Container className="bg-primary-2 p-[20px] text-center text-grey-9 text-xs">
      <Link
        href="https://www.territoiresentransitions.fr/outil-numerique"
        className="text-lg font-bold"
      >
        Territoires en Transitions
      </Link>
      <Text>
        Aider les collectivités à prioriser et mettre en œuvre
        <br /> une politique de transition écologique à la hauteur des enjeux
      </Text>
      <Text className="font-bold">contact@territoiresentransitions.fr</Text>
      <Text>Cet email a été envoyé à {toEmail}</Text>
      <Text>
        Vous l'avez reçu car vous êtes inscrit sur Territoiresentransitions.fr
      </Text>
      {unsubscribeUrl && <Link href={unsubscribeUrl}>Se désinscrire</Link>}
    </Container>
  </>
);
