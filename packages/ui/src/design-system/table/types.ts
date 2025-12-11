import { ReactNode } from 'react';

export type TableProps = {
  children: ReactNode | ReactNode[];
  className?: string;
};

export type TBodyProps = {
  children: ReactNode | ReactNode[];
  className?: string;
};

export type THeadProps = {
  children: ReactNode | ReactNode[];
  className?: string;
};

export type TRowProps = {
  children: ReactNode | ReactNode[];
  className?: string;
};

export type TCellProps = {
  children: ReactNode;
  className?: string;
  /** Variante de styles prédéfinie */
  variant?: 'title' | 'number' | 'input';
  colSpan?: number;
};
