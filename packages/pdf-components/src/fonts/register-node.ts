import { Font } from '@react-pdf/renderer';
import path from 'node:path';

const pkgRoot = path.resolve(
  path.dirname(require.resolve('@tet/pdf-components/package.json'))
);
const fontsDir = path.join(pkgRoot, 'assets/fonts');

export function registerMarianneForNode(): void {
  Font.register({
    family: 'Marianne',
    fonts: [
      { src: path.join(fontsDir, 'Marianne-Regular.ttf') },
      {
        src: path.join(fontsDir, 'Marianne-Regular_Italic.ttf'),
        fontStyle: 'italic',
      },
      {
        src: path.join(fontsDir, 'Marianne-Medium.ttf'),
        fontWeight: 500,
      },
      {
        src: path.join(fontsDir, 'Marianne-Medium_Italic.ttf'),
        fontWeight: 500,
        fontStyle: 'italic',
      },
      {
        src: path.join(fontsDir, 'Marianne-Bold.ttf'),
        fontWeight: 700,
      },
      {
        src: path.join(fontsDir, 'Marianne-Bold_Italic.ttf'),
        fontWeight: 700,
        fontStyle: 'italic',
      },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
}
