declare module '*.svg' {
  import { FC, SVGProps } from 'react';
  const content: FC<SVGProps<SVGElement>>;
  export default content;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.svg?url' {
  const content: any;
  export default content;
}
