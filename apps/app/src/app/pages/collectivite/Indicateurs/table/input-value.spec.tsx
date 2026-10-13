import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { InputValue } from './input-value';

afterEach(cleanup);

describe('InputValue', () => {
  it('refuse une saisie numérique qui dépasse la capacité des nombres JavaScript', () => {
    const onChange = vi.fn();
    render(<InputValue value={1} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '9'.repeat(400) },
    });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('conserve zéro comme valeur saisie', () => {
    const onChange = vi.fn();
    render(<InputValue value={1} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});
