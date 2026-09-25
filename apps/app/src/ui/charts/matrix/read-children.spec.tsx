import { describe, expect, it } from 'vitest';
import { XAxis } from './axis';
import { Caption } from './caption';
import { Quadrant } from './quadrant';
import { readCaption, readQuadrants, readXAxis } from './read-children';

describe('reading matrix children', () => {
  const zone = { from: { x: 0, y: 0 }, to: { x: 10, y: 10 } };

  it('reads a lone quadrant', () => {
    expect(readQuadrants(<Quadrant {...zone} title="Seule" />)).toEqual([
      { ...zone, title: 'Seule' },
    ]);
  });

  it('reads quadrants wrapped in a fragment', () => {
    const quadrants = readQuadrants(
      <>
        <Quadrant {...zone} title="Une" />
        <Quadrant {...zone} title="Deux" />
      </>
    );

    expect(quadrants.map(({ title }) => title)).toEqual(['Une', 'Deux']);
  });

  it('reads quadrants produced by a map', () => {
    const quadrants = readQuadrants(
      ['Une', 'Deux', 'Trois'].map((title) => (
        <Quadrant key={title} {...zone} title={title} />
      ))
    );

    expect(quadrants).toHaveLength(3);
  });

  it('skips a falsy child left by a condition', () => {
    expect(readQuadrants([false, null, <Quadrant key="a" {...zone} />])).toEqual(
      [zone]
    );
  });

  it('ignores a child that is neither a quadrant nor a fragment', () => {
    expect(readQuadrants(<div />)).toEqual([]);
  });

  it('ignores a plain text child', () => {
    expect(readQuadrants('du texte')).toEqual([]);
  });

  it('reads nothing from an absent child', () => {
    expect(readQuadrants(undefined)).toEqual([]);
  });

  it('reads the caption text', () => {
    expect(readCaption(<Caption>{'Une légende'}</Caption>)).toBe('Une légende');
  });

  it('reads the first x axis and ignores the quadrants around it', () => {
    expect(
      readXAxis(
        <>
          <Quadrant {...zone} />
          <XAxis name="Mobilisation" minLabel="Peu" maxLabel="Beaucoup" />
        </>
      )
    ).toEqual({ name: 'Mobilisation', minLabel: 'Peu', maxLabel: 'Beaucoup' });
  });

  it('reads no axis when none was declared', () => {
    expect(readXAxis(<Quadrant {...zone} />)).toBeUndefined();
  });

  it('ignores markers wrapped in a component instead of a fragment', () => {
    const Wrapper = () => <Caption>{'Perdue'}</Caption>;
    expect(readCaption(<Wrapper />)).toBeUndefined();
  });
});
