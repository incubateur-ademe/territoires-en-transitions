import path from 'node:path';
import type { ImageSources } from './primitives/DocumentToExport';

export function getNodeImageSources(): ImageSources {
  const pkgRoot = path.dirname(
    require.resolve('@tet/pdf-components/package.json')
  );
  return {
    repFrancaiseLogo: path.join(pkgRoot, 'assets/images/repFrancaiseLogo.png'),
    ademeLogo: path.join(pkgRoot, 'assets/images/ademeLogo.png'),
  };
}
