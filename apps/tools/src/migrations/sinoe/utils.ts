import { TYPOLOGIES_SINOE } from '@tet/domain/collectivites';

const sinoeIdByCode = new Map<string, string>(
  TYPOLOGIES_SINOE.map(({ codeSinoe, id }) => [codeSinoe, id])
);

/** Association d'une collectivité (code commune ou SIREN) à une typologie */
export type TypologieParCle = { cle: string; sinoeId: string };

export type ParseResult = {
  rows: TypologieParCle[];
  invalides: { ligne: number; raison: string }[];
};

/**
 * Id interne d'une typologie ; `null` si le code correspond à "non_precise" (absence
 * de typologie, à ne pas insérer) ; lève une erreur si le code est inconnu.
 */
export const toSinoeId = (codeSinoe: string): string | null => {
  const id = sinoeIdByCode.get(codeSinoe.trim());
  if (!id) {
    throw new Error(`Code typologie SINOE inconnu : "${codeSinoe}"`);
  }
  return id === 'non_precise' ? null : id;
};

/** SIREN (9 chiffres) à partir d'un SIREN ou d'un SIRET (14 chiffres) */
export const toSiren = (sirenOuSiret: string): string | null => {
  const valeur = sirenOuSiret.replace(/\D/g, '');
  if (!/^\d{9}$|^\d{14}$/.test(valeur)) {
    return null;
  }
  return valeur.slice(0, 9);
};

const parseRecords = (
  records: Record<string, string>[],
  toCle: (record: Record<string, string>) => string | null
): ParseResult => {
  const rows: TypologieParCle[] = [];
  const invalides: ParseResult['invalides'] = [];
  records.forEach((record, i) => {
    // +2 : ligne d'en-tête et numérotation à partir de 1
    const ligne = i + 2;
    const cle = toCle(record);
    if (!cle) {
      invalides.push({ ligne, raison: 'identifiant de collectivité invalide' });
      return;
    }
    try {
      const sinoeId = toSinoeId(record.code_typologie ?? '');
      if (sinoeId) {
        rows.push({ cle, sinoeId });
      }
    } catch (err) {
      invalides.push({ ligne, raison: (err as Error).message });
    }
  });
  return { rows, invalides };
};

/** Lignes du fichier TYPOLOGIE_COMMUNES : clé = code commune INSEE */
export const parseCommunesRecords = (
  records: Record<string, string>[]
): ParseResult =>
  parseRecords(records, (record) => {
    const code = (record.code_commune ?? '').trim();
    return /^[0-9][0-9AB][0-9]{3}$/.test(code) ? code : null;
  });

/** Lignes du fichier TYPOLOGIE_EPCI : clé = SIREN (SIRET tronqué si besoin) */
export const parseEpciRecords = (
  records: Record<string, string>[]
): ParseResult =>
  parseRecords(records, (record) => toSiren(record.SIRET ?? ''));

export type TypeFichier = 'communes' | 'epci';

/**
 * Type de fichier SINOE déduit des colonnes d'en-tête :
 * `code_commune` → communes, `SIRET` → EPCI.
 */
export const detectTypeFichier = (colonnes: string[]): TypeFichier => {
  const noms = new Set(colonnes.map((c) => c.trim()));
  const estCommunes = noms.has('code_commune');
  const estEpci = noms.has('SIRET');
  if (estCommunes === estEpci) {
    throw new Error(
      `Type de fichier non reconnu : une seule des colonnes "code_commune" (communes) ou "SIRET" (EPCI) est attendue. Colonnes lues : ${[
        ...noms,
      ].join(', ')}`
    );
  }
  if (!noms.has('code_typologie')) {
    throw new Error('Colonne "code_typologie" manquante');
  }
  return estCommunes ? 'communes' : 'epci';
};

/** Découpe un tableau en paquets de taille fixe */
export const chunk = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) {
    throw new Error(`chunk : size doit etre positif, recu ${size}`);
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};
