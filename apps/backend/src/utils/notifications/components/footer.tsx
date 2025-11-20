import { Hr, Text } from '@react-email/components';
import * as React from 'react';

export const Footer = (): React.ReactNode => (
  <>
    <Hr className="border-grey-3 my-4" />
    <Text className="text-grey-6 text-xs text-center m-0">
      Cet email a été envoyé automatiquement par Territoires en Transitions.
    </Text>
  </>
);
