import { createTw } from 'react-pdf-tailwind';
import { preset } from '@tet/ui';

export const twToCss = (input: string) =>
  createTw({ theme: preset.theme })(input) as React.CSSProperties;
