import { preset } from '@/ui';
import { Style } from '@react-pdf/types';
import { createTw } from 'react-pdf-tailwind';

export const tw: (input: string) => Style = createTw({ theme: preset.theme });
