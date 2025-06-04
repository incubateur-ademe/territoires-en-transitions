import { preuveAuditTable } from '@/backend/collectivites/documents/models/preuve-audit.table';
import { preuveLabellisationTable } from '@/backend/collectivites/documents/models/preuve-labellisation.table';
import DocumentService from '@/backend/collectivites/documents/services/document.service';
import { collectiviteTable } from '@/backend/collectivites/index-domain';
import { ComputeScoreMode } from '@/backend/referentiels/compute-score/compute-score-mode.enum';
import { ScoreAnalysis } from '@/backend/referentiels/compute-score/score-analysis.dto';
import ScoresService from '@/backend/referentiels/compute-score/scores.service';
import {
  getScoreRatios,
  ReferentielId,
} from '@/backend/referentiels/index-domain';
import { auditTable } from '@/backend/referentiels/labellisations/audit.table';
import { labellisationBibliothequeFichierTable } from '@/backend/referentiels/labellisations/labellisation-bibliotheque-fichier.table';
import { ListSnapshotsService } from '@/backend/referentiels/snapshots/list-snapshots/list-snapshots.service';
import { dcpTable } from '@/backend/users/index-domain';
import ConfigurationService from '@/backend/utils/config/configuration.service';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { getErrorMessage, roundTo } from '@/backend/utils/index-domain';
import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  eq,
  getTableColumns,
  isNotNull,
  or,
  SQL,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
import { chunk } from 'es-toolkit';
import { Workbook } from 'exceljs';
import { Response } from 'express';
// @ts-ignore
import pdf from 'pdf-parse-debugging-disabled';

@Injectable()
export default class ScoresAnalysisService {
  private readonly logger = new Logger(ScoresAnalysisService.name);

  private readonly SCORE_REGEX =
    /score\s*(?:validé|définitif|final|obtenu|de la collectivité)(?:[^\d]*)(\d{1,2}(?:[,.]\d+)?\s?%)/i;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly documentService: DocumentService,
    private readonly configService: ConfigurationService,
    private readonly scoreService: ScoresService,
    private readonly listSnapshotsService: ListSnapshotsService
  ) {}

  async compareSavedScoreToAuditReportScore(
    format: 'json' | 'xlsx' = 'json',
    collectiviteId: number | undefined,
    host: string,
    res: Response
  ) {
    if (typeof collectiviteId === 'string') {
      collectiviteId = parseInt(collectiviteId as unknown as string);
    }

    const sqlConditions: (SQL | SQLWrapper)[] = [
      isNotNull(labellisationBibliothequeFichierTable.collectiviteId),
      or(
        isNotNull(preuveLabellisationTable.modifiedAt),
        isNotNull(preuveAuditTable.modifiedAt)
      )!,
    ];
    if (collectiviteId) {
      sqlConditions.push(
        eq(labellisationBibliothequeFichierTable.collectiviteId, collectiviteId)
      );
    }

    const rapports: ScoreAnalysis[] = await this.databaseService.db
      .select({
        ...getTableColumns(labellisationBibliothequeFichierTable),
        collectiviteNom: collectiviteTable.nom,
        auditId: sql<number | null>`${preuveAuditTable.auditId}`,
        referentiel: auditTable.referentiel,
        modifiedAt: sql<string>`COALESCE(${preuveLabellisationTable.modifiedAt}, ${preuveAuditTable.modifiedAt})`,
        modifiedBy: sql<string>`COALESCE(${preuveLabellisationTable.modifiedBy}, ${preuveAuditTable.modifiedBy})`,
        modifiedByName: sql<string>`CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})`,
      })
      .from(labellisationBibliothequeFichierTable)
      .leftJoin(
        preuveLabellisationTable,
        and(
          eq(
            preuveLabellisationTable.fichierId,
            labellisationBibliothequeFichierTable.id
          ),
          eq(
            preuveLabellisationTable.collectiviteId,
            labellisationBibliothequeFichierTable.collectiviteId
          )
        )
      )
      .leftJoin(
        preuveAuditTable,
        and(
          eq(
            preuveAuditTable.fichierId,
            labellisationBibliothequeFichierTable.id
          ),
          eq(
            preuveAuditTable.collectiviteId,
            labellisationBibliothequeFichierTable.collectiviteId
          )
        )
      )
      .leftJoin(
        collectiviteTable,
        eq(
          labellisationBibliothequeFichierTable.collectiviteId,
          collectiviteTable.id
        )
      )
      .leftJoin(
        dcpTable,
        or(
          eq(dcpTable.userId, preuveLabellisationTable.modifiedBy),
          eq(dcpTable.userId, preuveAuditTable.modifiedBy)
        )
      )
      .leftJoin(auditTable, eq(auditTable.id, preuveAuditTable.auditId))
      .where(and(...sqlConditions));

    const filteredRapports = rapports.filter((rapport) =>
      rapport.filename?.match(/rapport/i)
    );

    const reportChunks = chunk(filteredRapports, 10);
    let iChunk = 1;
    for (const chunk of reportChunks) {
      this.logger.log(
        `Processing chunk ${iChunk}/${reportChunks.length} of ${chunk.length} reports`
      );

      await Promise.all(
        chunk.map(async (report) => {
          if (report.collectiviteId && report.hash) {
            try {
              this.logger.log(
                `extracting score from file ${report.filename} for collectivite ${report.collectiviteId}`
              );

              report.url = this.documentService.getDownloadUrl(
                host,
                report.collectiviteId,
                report.hash,
                this.configService.get('SUPABASE_ANON_KEY')
              );

              const { fileName, blob } =
                await this.documentService.downloadFile(
                  report.collectiviteId,
                  report.hash
                );
              const extractedScoreResult = await this.extractScoreFromPdfOrDocx(
                blob,
                fileName
              );
              report.extractedScore = extractedScoreResult?.extractedScore;
              report.extractedScoreText =
                extractedScoreResult?.extractedScoreText ||
                (collectiviteId
                  ? extractedScoreResult?.extractedFullText
                  : undefined);
            } catch (error) {
              this.logger.error(
                `Error extracting score from file ${
                  report.filename
                } for collectivite ${report.collectiviteId}: ${getErrorMessage(
                  error
                )}`
              );
            }
          }

          if (report.referentiel && report.collectiviteId && report.auditId) {
            try {
              const savedScore =
                await this.scoreService.computeScoreForCollectivite(
                  report.referentiel as ReferentielId,
                  report.collectiviteId,
                  {
                    mode: ComputeScoreMode.DEPUIS_SAUVEGARDE,
                    jalon: 'post_audit',
                    auditId: report.auditId,
                  }
                );
              const scoreRatio = savedScore?.scoresPayload?.scores.score
                ? getScoreRatios(savedScore?.scoresPayload?.scores.score)
                : null;
              report.savedScore = scoreRatio
                ? roundTo(scoreRatio.ratioFait * 100, 1) || undefined
                : undefined;
              report.savedScoreDate = savedScore?.scoresPayload?.date;

              if (report.modifiedAt) {
                const computedScore =
                  await this.scoreService.computeScoreForCollectivite(
                    report.referentiel as ReferentielId,
                    report.collectiviteId,
                    {
                      mode: ComputeScoreMode.RECALCUL,
                      date: report.modifiedAt,
                    }
                  );
                const computedScoreRatio = computedScore?.scoresPayload?.scores
                  .score
                  ? getScoreRatios(computedScore?.scoresPayload?.scores.score)
                  : null;
                report.computedScore = computedScoreRatio
                  ? roundTo(computedScoreRatio.ratioFait * 100, 1) || undefined
                  : undefined;
                report.computedDate = computedScore?.scoresPayload?.date;
              }
            } catch (error) {
              this.logger.error(
                `Error computing saved score for referentiel ${
                  report.referentiel
                } and collectivite ${report.collectiviteId}: ${getErrorMessage(
                  error
                )}`
              );
            }

            const snapshots = await this.listSnapshotsService.list({
              collectiviteId: report.collectiviteId,
              referentielId: report.referentiel as ReferentielId,
              options: { jalons: ['post_audit'] },
            });
            const foundSnapshot = snapshots.snapshots.find(
              (snapshot) => snapshot.auditId === report.auditId
            );
            if (foundSnapshot) {
              report.snapshotScore =
                roundTo(
                  (foundSnapshot.pointFait * 100) /
                    foundSnapshot.pointPotentiel,
                  1
                ) || undefined;
              report.snapshotDate = foundSnapshot.date;
            }
          }
        })
      );
      iChunk++;
    }

    if (format === 'json') {
      res.json(filteredRapports);
    } else {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');

      // Add header row based on keys
      const columns = Object.keys(filteredRapports[0]).map((key) => ({
        header: key,
        key,
      }));
      worksheet.columns = columns;

      // Add rows
      filteredRapports.forEach((item) => {
        worksheet.addRow(item);
      });

      res.attachment('ScoreAnalysis.xlsx');
      res.set('Access-Control-Expose-Headers', 'Content-Disposition');
      // Save to file
      await workbook.xlsx.writeFile('output.xlsx');

      res.send(await workbook.xlsx.writeBuffer());
    }
  }

  async extractScoreFromPdfOrDocx(
    file: Blob,
    fileName: string
  ): Promise<{
    extractedScore?: number;
    extractedScoreText?: string;
    extractedFullText: string;
  } | null> {
    const dataBuffer = await file.arrayBuffer();
    // Convert the ArrayBuffer to a Uint8Array
    const buffer = Buffer.from(dataBuffer);

    // Define your regex

    let text: string | null = null;
    if (fileName.endsWith('.pdf')) {
      this.logger.log(`Extracting text from PDF file: ${fileName}`);
      const pdfData = await pdf(buffer);
      // Extracted text
      text = pdfData.text;
    } else {
      this.logger.warn(`Unsupported file type: ${fileName}`);
    }

    if (text) {
      const matches = text.match(this.SCORE_REGEX);

      if (matches) {
        return {
          extractedScore: parseFloat(matches[1].replace(',', '.')),
          extractedScoreText: matches[0],
          extractedFullText: text,
        };
      }
      return { extractedFullText: text };
    }
    return null;
  }
}
