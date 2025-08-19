import { Test, TestingModule } from '@nestjs/testing';
import { z } from 'zod';
import { CsvService } from './csv.service';

describe('CsvService', () => {
  let service: CsvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvService],
    }).compile();

    service = module.get<CsvService>(CsvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDataFromCsvContent', () => {
    it('should parse CSV content without schema', async () => {
      const csvContent = `name;age;city
John;30;Paris
Jane;25;Lyon`;

      const result = await service.getDataFromCsvContent(csvContent);

      expect(result.data).toHaveLength(2);
      expect(result.processed).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.data[0]).toEqual({
        name: 'John',
        age: '30',
        city: 'Paris',
      });
      expect(result.data[1]).toEqual({ name: 'Jane', age: '25', city: 'Lyon' });
    });

    it('should parse CSV content with schema validation', async () => {
      const csvContent = `name;age;city
John;30;Paris
Jane;25;Lyon`;

      const schema = z.object({
        name: z.string(),
        age: z.coerce.number(),
        city: z.string(),
      });

      const result = await service.getDataFromCsvContent(csvContent, {
        schema,
      });

      expect(result.data).toHaveLength(2);
      expect(result.processed).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.data[0]).toEqual({ name: 'John', age: 30, city: 'Paris' });
      expect(result.data[1]).toEqual({ name: 'Jane', age: 25, city: 'Lyon' });
    });

    it('should handle schema validation errors', async () => {
      const csvContent = `name;age;city
John;invalid;Paris
Jane;25;Lyon`;

      const schema = z.object({
        name: z.string(),
        age: z.coerce.number(),
        city: z.string(),
      });

      const result = await service.getDataFromCsvContent(csvContent, {
        schema,
      });

      expect(result.data).toHaveLength(1);
      expect(result.processed).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Error processing row 1');
      expect(result.data[0]).toEqual({ name: 'Jane', age: 25, city: 'Lyon' });
    });

    it('should handle different delimiters', async () => {
      const csvContent = `name,age,city
John,30,Paris
Jane,25,Lyon`;

      const result = await service.getDataFromCsvContent(csvContent, {
        parseOptions: {
          delimiter: ',',
          columns: true,
        },
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        name: 'John',
        age: '30',
        city: 'Paris',
      });
    });
  });

  describe('parseCsvContent', () => {
    it('should return only the data array', async () => {
      const csvContent = `name;age
John;30
Jane;25`;

      const data = await service.parseCsvContent(csvContent);

      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({ name: 'John', age: '30' });
      expect(data[1]).toEqual({ name: 'Jane', age: '25' });
    });
  });
});
