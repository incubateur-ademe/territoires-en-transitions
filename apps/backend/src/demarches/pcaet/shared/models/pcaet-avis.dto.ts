import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { pcaetAvisAuTitreDeSchema } from '@tet/domain/demarches';
import { z } from 'zod';
import { sqlToNullableDateTimeISO } from './demarche-pcaet.dto';
import { pcaetAvisTable } from './pcaet-avis.table';

export const pcaetAvisSchema = z.object({
  id: z.string(),
  demandeAvisId: z.number(),
  auTitreDe: pcaetAvisAuTitreDeSchema,
  fichierRef: z.string().nullable(),
  valideLe: z.string().nullable(),
  deposePar: z.string().nullable(),
  deposeLe: z.string(),
  modifieLe: z.string().nullable(),
  envoyeLe: z.string().nullable(),
});

export type PcaetAvis = z.infer<typeof pcaetAvisSchema>;

export const pcaetAvisSelectColumns = {
  id: pcaetAvisTable.id,
  demandeAvisId: pcaetAvisTable.demandeAvisId,
  auTitreDe: pcaetAvisTable.auTitreDe,
  fichierRef: pcaetAvisTable.fichierRef,
  valideLe: sqlToNullableDateTimeISO(pcaetAvisTable.valideLe),
  deposePar: pcaetAvisTable.deposePar,
  deposeLe: sqlToDateTimeISO(pcaetAvisTable.deposeLe),
  modifieLe: sqlToNullableDateTimeISO(pcaetAvisTable.modifieLe),
  envoyeLe: sqlToNullableDateTimeISO(pcaetAvisTable.envoyeLe),
};
