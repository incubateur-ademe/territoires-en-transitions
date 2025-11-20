import { Style } from '@react-pdf/types';
import { preset } from '@tet/ui';
import { createTw } from 'react-pdf-tailwind';

export const tw: (input: string) => Style = createTw({ theme: preset.theme });
