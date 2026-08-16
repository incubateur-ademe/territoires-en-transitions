import { Text } from '@react-email/components';
import { EmailContainer } from '@tet/backend/utils/notifications/components/email-container';
import * as React from 'react';

export type EnvoyerAvisEmailProps = {
  message: string;
};

export const EnvoyerAvisEmail = ({
  message,
}: EnvoyerAvisEmailProps): React.ReactNode => (
  <EmailContainer>
    {message.split('\n').map((ligne, index) => (
      <Text key={index}>{ligne}</Text>
    ))}
  </EmailContainer>
);
