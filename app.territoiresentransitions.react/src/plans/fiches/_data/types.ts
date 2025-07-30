import { RouterInput, RouterOutput } from '@/api/utils/trpc/client';

export type ListFichesInput = RouterInput['plans']['fiches']['listResumes'];
export type ListFicheResumesOutput =
  RouterOutput['plans']['fiches']['listResumes'];

export type CountByFilter = RouterInput['plans']['fiches']['countBy']['filter'];
export type CountByProperty =
  RouterInput['plans']['fiches']['countBy']['countByProperty'];
