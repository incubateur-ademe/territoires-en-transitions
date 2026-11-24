import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { territoryCodeSchema, type Level, type Territory } from '../../domain/territory.ts'
import { createCsvDataSource } from './csv-data-source.ts'

type ManifestOverrides = {
  checksum?: string
  keyColumn?: string
  controlTotals?: Record<string, string>
  columns?: { name: string; unit: string }[]
}

type DatasetFixture = {
  csv?: string | Buffer
  manifestText?: string
  manifest?: ManifestOverrides
  withoutLevel?: boolean
}

const temporaryDirectories: string[] = []

function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex')
}

function columnsOf(csv: string | Buffer | undefined): { name: string; unit: string }[] {
  const header = String(csv ?? '').split('\n')[0] ?? ''
  return header.split(',').map((name) => ({ name, unit: 'texte' }))
}

function createRoot(fixture: DatasetFixture): string {
  const root = mkdtempSync(join(tmpdir(), 'leviers-ges-'))
  temporaryDirectories.push(root)
  mkdirSync(join(root, 'demo'))
  const csv = fixture.csv
  if (csv !== undefined) writeFileSync(join(root, 'demo', 'values.csv'), csv)
  const manifestText =
    fixture.manifestText ??
    JSON.stringify({
      datasets: [
        {
          file: 'values.csv',
          source: 'Source de test',
          link: 'https://example.org',
          vintage: '2024',
          retrievedOn: '2026-10-07',
          checksum: sha256(csv ?? ''),
          level: fixture.withoutLevel === true ? undefined : 'region',
          keyColumn: 'code',
          columns: columnsOf(csv),
          ...fixture.manifest,
        },
      ],
    })
  writeFileSync(join(root, 'demo', 'manifest.json'), manifestText)
  return root
}

function territory(code: string, level: Level = 'region'): Territory<Level> {
  return { level, code: territoryCodeSchema.parse(code) }
}

const VALUES_CSV = 'code,value,hectares\n11,1.5,10\n24,2,5.25\n'

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => {
    rmSync(directory, { recursive: true, force: true })
  })
})

describe('createCsvDataSource', () => {
  describe('lecture', () => {
    it('lit la ligne d’un territoire par son code', () => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV }))
      expect(source.row('demo/values', territory('24'))._unsafeUnwrap()).toEqual({
        code: '24',
        value: '2',
        hectares: '5.25',
      })
    })

    it('lit toutes les lignes d’un jeu, dans l’ordre du fichier', () => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV }))
      expect(source.rows('demo/values')._unsafeUnwrap()).toEqual([
        { code: '11', value: '1.5', hectares: '10' },
        { code: '24', value: '2', hectares: '5.25' },
      ])
    })

    it('rend la provenance du jeu : source, millésime et date de récupération du manifeste', () => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV }))
      expect(source.provenance('demo/values')._unsafeUnwrap()).toEqual({
        dataset: 'demo/values',
        source: 'Source de test',
        vintage: '2024',
        retrievedOn: '2026-10-07',
      })
    })

    it('renvoie l’erreur du jeu quand on lit toutes ses lignes', () => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV }))
      expect(source.rows('demo/absent')._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_dataset',
        reason: 'unknown_dataset',
      })
    })

    it('lit une constante par son nom, en texte', () => {
      const source = createCsvDataSource(
        createRoot({ csv: 'name,value\nFS,1.17\n', manifest: { keyColumn: 'name' } }),
      )
      expect(source.constant('demo/values', 'FS')._unsafeUnwrap()).toBe('1.17')
    })

    it('renvoie MissingData pour un territoire absent', () => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV }))
      expect(source.row('demo/values', territory('99'))._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset: 'demo/values',
        key: '99',
      })
    })

    it('renvoie MissingData pour une constante absente', () => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV }))
      expect(source.constant('demo/values', '99')._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset: 'demo/values',
        key: '99',
      })
    })

    it('renvoie MissingData quand la ligne n’a pas de colonne value', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,hectares\n11,10\n' }))
      expect(source.constant('demo/values', '11')._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset: 'demo/values',
        key: '11',
      })
    })

    it('renvoie MissingData quand la valeur de la constante est vide', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,value\nFS,\n' }))
      expect(source.constant('demo/values', 'FS')._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset: 'demo/values',
        key: 'FS',
      })
    })

    it('ne lit le fichier qu’une fois pour plusieurs lectures', () => {
      const root = createRoot({ csv: VALUES_CSV })
      const source = createCsvDataSource(root)
      const first = source.row('demo/values', territory('11'))._unsafeUnwrap()
      rmSync(join(root, 'demo', 'values.csv'))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrap()).toBe(first)
    })

    it('ne charge que le jeu demandé : un jeu cassé n’empêche pas la lecture d’un autre', () => {
      const root = createRoot({ csv: VALUES_CSV })
      mkdirSync(join(root, 'broken'))
      writeFileSync(join(root, 'broken', 'manifest.json'), '{')
      const source = createCsvDataSource(root)
      expect(source.row('broken/values', territory('11'))._unsafeUnwrapErr().kind).toBe(
        'invalid_dataset',
      )
      expect(source.row('demo/values', territory('11')).isOk()).toBe(true)
    })

    it('ne garde pas en mémoire une erreur de lecture : le jeu se charge au second appel', () => {
      const root = createRoot({
        manifest: { checksum: sha256(VALUES_CSV), columns: columnsOf(VALUES_CSV) },
      })
      const source = createCsvDataSource(root)
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'unreadable',
      })
      writeFileSync(join(root, 'demo', 'values.csv'), VALUES_CSV)
      expect(source.row('demo/values', territory('11')).isOk()).toBe(true)
    })

    it('garde en mémoire une erreur de contenu : pas de relecture d’un jeu corrompu', () => {
      const root = createRoot({ csv: VALUES_CSV, manifest: { checksum: sha256('autre') } })
      const source = createCsvDataSource(root)
      expect(source.row('demo/values', territory('11')).isErr()).toBe(true)
      writeFileSync(join(root, 'demo', 'values.csv'), 'code,value,hectares\n11,9,9\n')
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'checksum_mismatch',
      })
    })
  })

  describe('niveau du territoire', () => {
    it('refuse un territoire d’un autre niveau que celui du jeu', () => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV }))
      expect(source.row('demo/values', territory('11', 'departement'))._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'demo/values',
        reason: 'level_mismatch',
        detail: 'expected region, got departement',
      })
    })

    it('refuse une ligne de territoire dans un jeu sans niveau', () => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV, withoutLevel: true }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'level_mismatch',
        detail: 'expected undefined, got region',
      })
    })
  })

  describe('jeu invalide', () => {
    it.each([
      ['un nom sans dossier', 'values'],
      ['un dossier sans manifeste', 'absent/values'],
      ['un fichier absent du manifeste', 'demo/other'],
      ['un nom qui remonte l’arborescence', '../demo/values'],
      ['un nom avec des majuscules', 'Demo/Values'],
    ])('refuse %s : unknown_dataset', (_label, dataset) => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV }))
      expect(source.row(dataset, territory('11'))._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_dataset',
        dataset,
        reason: 'unknown_dataset',
      })
    })

    it('refuse un dossier qui est en réalité un fichier : unknown_dataset', () => {
      const root = createRoot({ csv: VALUES_CSV })
      writeFileSync(join(root, 'afile'), 'x')
      const source = createCsvDataSource(root)
      expect(source.row('afile/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'unknown_dataset',
      })
    })

    it('refuse un manifeste présent mais illisible', () => {
      const root = createRoot({ csv: VALUES_CSV })
      rmSync(join(root, 'demo', 'manifest.json'))
      mkdirSync(join(root, 'demo', 'manifest.json'))
      const source = createCsvDataSource(root)
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'unreadable',
      })
    })

    it('refuse un manifeste qui n’est pas du JSON', () => {
      const source = createCsvDataSource(createRoot({ csv: VALUES_CSV, manifestText: '{' }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'invalid_manifest',
      })
    })

    it('refuse un manifeste qui ne respecte pas le schéma', () => {
      const source = createCsvDataSource(
        createRoot({ csv: VALUES_CSV, manifestText: '{"datasets":[{"file":"values.csv"}]}' }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'invalid_manifest',
      })
    })

    it('refuse un fichier CSV absent du disque', () => {
      const source = createCsvDataSource(
        createRoot({ manifest: { checksum: sha256(''), columns: columnsOf(VALUES_CSV) } }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'unreadable',
      })
    })

    it('refuse un fichier dont le total de contrôle ne correspond pas', () => {
      const source = createCsvDataSource(
        createRoot({ csv: VALUES_CSV, manifest: { checksum: sha256('autre contenu') } }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'demo/values',
        reason: 'checksum_mismatch',
        detail: `expected ${sha256('autre contenu')}, got ${sha256(VALUES_CSV)}`,
      })
    })

    it('refuse un fichier qui n’est pas en UTF-8', () => {
      const source = createCsvDataSource(createRoot({ csv: Buffer.from([0x63, 0xff, 0xfe]) }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'not_utf8',
      })
    })

    it('refuse un CSV dont une ligne n’a pas le bon nombre de colonnes', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,value\n11,1,2\n' }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'malformed_csv',
      })
    })

    it('refuse deux colonnes de même nom', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,code\n11,12\n' }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'malformed_csv',
        detail: expect.stringContaining('duplicate column names') as string,
      })
    })

    it('garde en mémoire un CSV malformé : pas de relecture du fichier', () => {
      const root = createRoot({ csv: 'code,value\n11,1,2\n' })
      const source = createCsvDataSource(root)
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'malformed_csv',
      })
      writeFileSync(join(root, 'demo', 'values.csv'), 'code,value\n11,1\n')
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'malformed_csv',
      })
    })

    it('refuse un jeu sans aucune ligne', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,value\n' }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'empty_dataset',
      })
    })

    it('refuse deux lignes de même clé', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,value\n11,1\n11,2\n' }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'duplicate_key',
        detail: 'code',
      })
    })

    it('refuse une clé vide', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,value\n,1.5\n' }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'empty_key',
        detail: 'code',
      })
    })
  })

  describe('colonnes du manifeste', () => {
    it('refuse une colonne du CSV que le manifeste ne déclare pas', () => {
      const source = createCsvDataSource(
        createRoot({ csv: VALUES_CSV, manifest: { columns: columnsOf('code,value') } }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'demo/values',
        reason: 'columns_mismatch',
        detail: 'hectares',
      })
    })

    it('refuse une colonne déclarée que le CSV n’a pas', () => {
      const source = createCsvDataSource(
        createRoot({ csv: 'code,value\n11,1\n', manifest: { columns: columnsOf(VALUES_CSV) } }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'columns_mismatch',
        detail: 'hectares',
      })
    })

    it('refuse une colonne clé que le manifeste ne déclare pas', () => {
      const source = createCsvDataSource(
        createRoot({ csv: VALUES_CSV, manifest: { keyColumn: 'insee' } }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'columns_mismatch',
        detail: 'insee',
      })
    })
  })

  describe('format des valeurs', () => {
    it('accepte une valeur à 12 décimales', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,value\n11,0.123456789012\n' }))
      expect(source.row('demo/values', territory('11')).isOk()).toBe(true)
    })

    it('refuse une valeur à 13 décimales : bruit de flottant', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,value\n11,56.2500000000001\n' }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'excess_precision',
        detail: 'value=56.2500000000001',
      })
    })

    it('refuse une virgule décimale', () => {
      const source = createCsvDataSource(createRoot({ csv: 'code,value\n11,"1,5"\n' }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'decimal_comma',
        detail: 'value=1,5',
      })
    })

    it.each(['1.5E-13', '2e3', '-4.1e+2'])('refuse la notation scientifique %s', (value) => {
      const source = createCsvDataSource(createRoot({ csv: `code,value\n11,${value}\n` }))
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'scientific_notation',
        detail: `value=${value}`,
      })
    })
  })

  describe('totaux de contrôle du manifeste', () => {
    it('accepte une colonne dont la somme vaut le total annoncé', () => {
      const source = createCsvDataSource(
        createRoot({ csv: VALUES_CSV, manifest: { controlTotals: { hectares: '15.25' } } }),
      )
      expect(source.row('demo/values', territory('11')).isOk()).toBe(true)
    })

    it('refuse une colonne dont la somme diffère du total annoncé', () => {
      const source = createCsvDataSource(
        createRoot({ csv: VALUES_CSV, manifest: { controlTotals: { hectares: '15' } } }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'control_total_mismatch',
        detail: 'hectares: expected 15, got 15.25',
      })
    })

    it('refuse un total annoncé qui n’est pas un nombre', () => {
      const source = createCsvDataSource(
        createRoot({ csv: VALUES_CSV, manifest: { controlTotals: { hectares: '0x0F' } } }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'control_total_mismatch',
      })
    })

    it('refuse un total sur une colonne non déclarée par le manifeste', () => {
      const source = createCsvDataSource(
        createRoot({ csv: VALUES_CSV, manifest: { controlTotals: { surface: '1' } } }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'columns_mismatch',
        detail: 'surface',
      })
    })

    it('refuse une colonne à total qui contient un texte', () => {
      const source = createCsvDataSource(
        createRoot({ csv: 'code,value\n11,abc\n', manifest: { controlTotals: { value: '1' } } }),
      )
      expect(source.row('demo/values', territory('11'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'control_total_mismatch',
        detail: 'value is absent or not numeric',
      })
    })
  })
})
