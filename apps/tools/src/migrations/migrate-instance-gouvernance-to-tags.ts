#!/usr/bin/env tsx
/**
 * Migration script to transform instance de gouvernance data from CSV
 * into tags and additional_description columns
 *
 * Usage: tsx apps/tools/src/migrations/migrate-instance-gouvernance-to-tags.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface InputRow {
  ficheId: number;
  collectiviteId: number;
  instanceGouvernance: string;
  migration: string;
}

interface OutputRow {
  ficheId: number;
  collectiviteId: number;
  tags: string[];
  additional_description: string | null;
}

const SPECIAL_COLLECTIVITE_ID = 4165;
const SPECIAL_TAG = 'COPIL PCAET';
const SPECIAL_TEXT =
  "CAMA, ADEME, DDT, Région AURA, communes, associations, organes représentatifs, ATMO, SDED, CNR, Chambre d'Agriculture, SCoT RPB, CCI, CMA";

/**
 * Split a string by comma, carriage return, and newline, then trim each part
 */
function splitAndTrim(text: string): string[] {
  if (!text || text.trim() === '') {
    return [];
  }

  return text
    .split(/[,;\r\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Process a single row according to the migration rules
 */
function processRow(row: InputRow): OutputRow {
  const { ficheId, collectiviteId, instanceGouvernance, migration } = row;

  // Handle special case: collectiviteId 4165 with special migration value
  if (
    collectiviteId === SPECIAL_COLLECTIVITE_ID &&
    migration !== 'Tag' &&
    migration !== 'Texte'
  ) {
    return {
      ficheId,
      collectiviteId,
      tags: [SPECIAL_TAG],
      additional_description: `Instance de gouvernance : ${SPECIAL_TEXT}`,
    };
  }

  // Handle "Tag" migration type
  if (migration === 'Tag') {
    const tags = splitAndTrim(instanceGouvernance);
    return {
      ficheId,
      collectiviteId,
      tags,
      additional_description: null,
    };
  }

  // Handle "Texte" migration type
  if (migration === 'Texte') {
    return {
      ficheId,
      collectiviteId,
      tags: [],
      additional_description: `Instance de gouvernance : ${instanceGouvernance.trim()}`,
    };
  }

  // Default case: empty tags and no additional description
  return {
    ficheId,
    collectiviteId,
    tags: [],
    additional_description: null,
  };
}

/**
 * Parse a CSV line with proper handling of quoted fields
 * Handles quoted fields that may contain newlines, semicolons, and commas
 */
function parseCSVLine(
  content: string,
  startIndex: number
): { fields: string[]; nextIndex: number } {
  const fields: string[] = [];
  let currentField = '';
  let i = startIndex;
  let inQuotes = false;

  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote (double quote)
        currentField += '"';
        i += 2;
      } else if (
        inQuotes &&
        (nextChar === ';' || nextChar === '\n' || i === content.length - 1)
      ) {
        // End of quoted field
        inQuotes = false;
        i++;
      } else {
        // Start or end of quoted field
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ';' && !inQuotes) {
      // Field separator (only outside quotes)
      fields.push(currentField.trim());
      currentField = '';
      i++;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of line (only outside quotes)
      if (char === '\r' && nextChar === '\n') {
        i += 2; // Skip \r\n
      } else {
        i++;
      }
      break;
    } else {
      currentField += char;
      i++;
    }
  }

  // Add the last field
  if (currentField.length > 0 || fields.length > 0) {
    fields.push(currentField.trim());
  }

  return { fields, nextIndex: i };
}

/**
 * Parse CSV file and return array of input rows
 * Properly handles quoted fields that may contain newlines
 */
function parseCSV(filePath: string): InputRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows: InputRow[] = [];
  let index = 0;
  let lineNumber = 0;

  // Skip header row
  const headerResult = parseCSVLine(content, index);
  index = headerResult.nextIndex;
  lineNumber++;

  // Parse data rows
  while (index < content.length) {
    // Skip empty lines
    while (
      index < content.length &&
      (content[index] === '\n' || content[index] === '\r')
    ) {
      if (content[index] === '\r' && content[index + 1] === '\n') {
        index += 2;
      } else {
        index++;
      }
    }

    if (index >= content.length) {
      break;
    }

    const result = parseCSVLine(content, index);
    const fields = result.fields;
    index = result.nextIndex;
    lineNumber++;

    // Skip empty rows
    if (fields.length === 0 || fields.every((f) => f.trim() === '')) {
      continue;
    }

    // Format: ficheId;collectiviteId;instance_gouvernance;Migration
    // Header has leading semicolon (empty first field), but data rows don't
    // So for data rows: fields[0] = ficheId, fields[1] = collectiviteId, etc.
    const ficheIdStr = fields[0] || '';
    const collectiviteIdStr = fields[1] || '';
    const instanceGouvernance = fields[2] || '';
    const migration = fields[3] || '';

    const ficheId = parseInt(ficheIdStr, 10);
    const collectiviteId = parseInt(collectiviteIdStr, 10);

    if (isNaN(ficheId) || isNaN(collectiviteId)) {
      console.warn(
        `⚠️  Skipping invalid row at line ${lineNumber}: ficheId=${ficheIdStr}, collectiviteId=${collectiviteIdStr}`
      );
      continue;
    }

    rows.push({
      ficheId,
      collectiviteId,
      instanceGouvernance,
      migration,
    });
  }

  return rows;
}

/**
 * Main function
 */
function main() {
  const csvPath = path.join(__dirname, 'instance_gouvernance_migration.csv');

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  console.log('📖 Reading CSV file...');
  const inputRows = parseCSV(csvPath);
  console.log(`   Found ${inputRows.length} rows`);

  console.log('🔄 Processing rows...');
  const outputRows: OutputRow[] = inputRows.map((row) => processRow(row));

  // Count statistics
  const tagCount = outputRows.filter((r) => r.tags.length > 0).length;
  const textCount = outputRows.filter(
    (r) => r.additional_description !== null
  ).length;
  const specialCount = outputRows.filter((r) =>
    r.tags.includes(SPECIAL_TAG)
  ).length;

  console.log(`   ✅ Processed ${outputRows.length} rows`);
  console.log(`   📊 Statistics:`);
  console.log(`      - Rows with tags: ${tagCount}`);
  console.log(`      - Rows with additional_description: ${textCount}`);
  console.log(
    `      - Special cases (collectiviteId ${SPECIAL_COLLECTIVITE_ID}): ${specialCount}`
  );

  // Display sample output
  console.log('\n📋 Sample output (first 5 rows):');
  outputRows.slice(0, 5).forEach((row, index) => {
    console.log(`\n   Row ${index + 1}:`);
    console.log(`      ficheId: ${row.ficheId}`);
    console.log(`      collectiviteId: ${row.collectiviteId}`);
    console.log(`      tags: [${row.tags.join(', ')}]`);
    console.log(
      `      additional_description: ${row.additional_description || 'null'}`
    );
  });

  // Export to CSV
  console.log('\n💾 Exporting to CSV...');
  const outputCsvPath = path.join(
    __dirname,
    'instance_gouvernance_migration_output.csv'
  );
  exportToCSV(outputRows, outputCsvPath);
  console.log(`   ✅ Exported to: ${outputCsvPath}`);

  return outputRows;
}

/**
 * Export output rows to CSV file
 */
function exportToCSV(rows: OutputRow[], filePath: string): void {
  const lines: string[] = [];

  // Header
  lines.push('ficheId;collectiviteId;tags;additional_description');

  // Data rows
  for (const row of rows) {
    // Escape fields that contain semicolons, quotes, or newlines
    const escapeField = (field: string | null): string => {
      if (field === null || field === '') {
        return '';
      }
      // If field contains semicolon, quote, or newline, wrap in quotes and escape quotes
      if (field.includes(';') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    // Convert tags array to comma-separated string
    const tagsStr = row.tags.join(', ');
    const tagsField = escapeField(tagsStr);
    const additionalDescriptionField = escapeField(row.additional_description);

    lines.push(
      `${row.ficheId};${row.collectiviteId};${tagsField};${additionalDescriptionField}`
    );
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

// Run the migration
const result = main();
console.log(`\n✅ Migration script completed successfully`);
console.log(`   Returned ${result.length} processed rows`);

export { processRow, splitAndTrim, parseCSV };
