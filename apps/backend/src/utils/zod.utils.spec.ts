import { describe, expect, it } from 'vitest';
import * as Zod from 'zod';
import * as zMini from 'zod/mini';
import { getPropertyPaths } from './zod.utils';

describe('getPropertyPaths', () => {
  it('should return empty array for primitive schemas', () => {
    expect(getPropertyPaths(Zod.z.string())).toEqual([]);
    expect(getPropertyPaths(Zod.z.number())).toEqual([]);
    expect(getPropertyPaths(Zod.z.boolean())).toEqual([]);
    expect(getPropertyPaths(Zod.z.date())).toEqual([]);
  });

  it('should return empty array for enum schemas', () => {
    expect(getPropertyPaths(Zod.z.enum(['a', 'b', 'c']))).toEqual([]);
  });

  it('should handle nullable schemas', () => {
    const schema = Zod.z.string().nullable();
    expect(getPropertyPaths(schema)).toEqual([]);
  });

  it('should handle optional schemas', () => {
    const schema = Zod.z.string().optional();
    expect(getPropertyPaths(schema)).toEqual([]);
  });

  it('should handle nullable and optional together', () => {
    const schema = Zod.z.string().nullable().optional();
    expect(getPropertyPaths(schema)).toEqual([]);
  });

  it('should handle array schemas', () => {
    const schema = Zod.z.array(Zod.z.string());
    expect(getPropertyPaths(schema)).toEqual([]);
  });

  it('should handle array of objects', () => {
    const schema = Zod.z.array(
      Zod.z.object({
        name: Zod.z.string(),
        age: Zod.z.number(),
      })
    );
    expect(getPropertyPaths(schema)).toEqual(['name', 'age']);
  });

  it('should return property paths for simple object schema', () => {
    const schema = Zod.z.object({
      name: Zod.z.string(),
      age: Zod.z.number(),
      active: Zod.z.boolean(),
    });
    expect(getPropertyPaths(schema)).toEqual(['name', 'age', 'active']);
  });

  it('should handle nested object schemas', () => {
    const schema = Zod.z.object({
      user: Zod.z.object({
        name: Zod.z.string(),
        email: Zod.z.string(),
      }),
      count: Zod.z.number(),
    });
    expect(getPropertyPaths(schema)).toEqual([
      'user.name',
      'user.email',
      'count',
    ]);
  });

  it('should handle deeply nested object schemas', () => {
    const schema = Zod.z.object({
      level1: Zod.z.object({
        level2: Zod.z.object({
          level3: Zod.z.object({
            value: Zod.z.string(),
          }),
        }),
      }),
    });
    expect(getPropertyPaths(schema)).toEqual(['level1.level2.level3.value']);
  });

  it('should handle nullable object properties', () => {
    const schema = Zod.z.object({
      name: Zod.z.string().nullable(),
      age: Zod.z.number(),
    });
    expect(getPropertyPaths(schema)).toEqual(['name', 'age']);
  });

  it('should handle optional object properties', () => {
    const schema = Zod.z.object({
      name: Zod.z.string().optional(),
      age: Zod.z.number(),
    });
    expect(getPropertyPaths(schema)).toEqual(['name', 'age']);
  });

  it('should handle nullable nested objects', () => {
    const schema = Zod.z.object({
      user: Zod.z
        .object({
          name: Zod.z.string(),
          email: Zod.z.string(),
        })
        .nullable(),
      count: Zod.z.number(),
    });
    expect(getPropertyPaths(schema)).toEqual([
      'user.name',
      'user.email',
      'count',
    ]);
  });

  it('should handle optional nested objects', () => {
    const schema = Zod.z.object({
      user: Zod.z
        .object({
          name: Zod.z.string(),
          email: Zod.z.string(),
        })
        .optional(),
      count: Zod.z.number(),
    });
    expect(getPropertyPaths(schema)).toEqual([
      'user.name',
      'user.email',
      'count',
    ]);
  });

  it('should handle array properties in objects', () => {
    const schema = Zod.z.object({
      tags: Zod.z.array(Zod.z.string()),
      name: Zod.z.string(),
    });
    expect(getPropertyPaths(schema)).toEqual(['tags', 'name']);
  });

  it('should handle array of objects in objects', () => {
    const schema = Zod.z.object({
      users: Zod.z.array(
        Zod.z.object({
          name: Zod.z.string(),
          age: Zod.z.number(),
        })
      ),
      count: Zod.z.number(),
    });
    expect(getPropertyPaths(schema)).toEqual([
      'users.name',
      'users.age',
      'count',
    ]);
  });

  it('should handle complex nested structures', () => {
    const schema = Zod.z.object({
      user: Zod.z.object({
        profile: Zod.z.object({
          firstName: Zod.z.string(),
          lastName: Zod.z.string(),
        }),
        settings: Zod.z.array(
          Zod.z.object({
            key: Zod.z.string(),
            value: Zod.z.string(),
          })
        ),
      }),
      metadata: Zod.z.object({
        version: Zod.z.number(),
      }),
    });
    expect(getPropertyPaths(schema)).toEqual([
      'user.profile.firstName',
      'user.profile.lastName',
      'user.settings.key',
      'user.settings.value',
      'metadata.version',
    ]);
  });

  it('should handle empty object schema', () => {
    const schema = Zod.z.object({});
    expect(getPropertyPaths(schema)).toEqual([]);
  });

  describe('with zod/mini', () => {
    it('should return property paths for zod/mini object schema', () => {
      const schema = zMini.z.object({
        name: zMini.z.string(),
        age: zMini.z.number(),
        active: zMini.z.boolean(),
      });
      expect(getPropertyPaths(schema)).toEqual(['name', 'age', 'active']);
    });

    it('should handle nested zod/mini object schemas', () => {
      const schema = zMini.z.object({
        user: zMini.z.object({
          name: zMini.z.string(),
          email: zMini.z.string(),
        }),
        count: zMini.z.number(),
      });
      expect(getPropertyPaths(schema)).toEqual([
        'user.name',
        'user.email',
        'count',
      ]);
    });

    it('should handle nullable zod/mini schemas', () => {
      const schema = zMini.z.nullable(zMini.z.string());
      expect(getPropertyPaths(schema)).toEqual([]);
    });

    it('should handle optional zod/mini schemas', () => {
      const schema = zMini.z.optional(zMini.z.string());
      expect(getPropertyPaths(schema)).toEqual([]);
    });

    it('should handle array of zod/mini objects', () => {
      const schema = zMini.z.array(
        zMini.z.object({
          name: zMini.z.string(),
          age: zMini.z.number(),
        })
      );
      expect(getPropertyPaths(schema)).toEqual(['name', 'age']);
    });

    it('should handle complex zod/mini schema similar to indicateurDefinitionSchema', () => {
      const schema = zMini.z.object({
        id: zMini.z.number(),
        version: zMini.z.string(),
        titre: zMini.z.string(),
        titreLong: zMini.z.nullable(zMini.z.string()),
        description: zMini.z.nullable(zMini.z.string()),
        unite: zMini.z.string(),
        precision: zMini.z.number(),
        borneMin: zMini.z.nullable(zMini.z.number()),
        borneMax: zMini.z.nullable(zMini.z.number()),
      });
      expect(getPropertyPaths(schema)).toEqual([
        'id',
        'version',
        'titre',
        'titreLong',
        'description',
        'unite',
        'precision',
        'borneMin',
        'borneMax',
      ]);
    });
  });
});
