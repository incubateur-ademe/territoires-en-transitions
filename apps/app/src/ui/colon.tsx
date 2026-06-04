import { ReactElement } from 'react';

const NON_BREAKING_SPACE = '\u00a0';

const Colon = (): ReactElement => <>{`${NON_BREAKING_SPACE}: `}</>;

export { Colon };
