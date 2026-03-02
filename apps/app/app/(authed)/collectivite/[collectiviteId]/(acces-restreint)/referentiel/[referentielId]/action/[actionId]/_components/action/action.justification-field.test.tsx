import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActionJustificationField } from './action.justification-field';

// Mock dependencies
vi.mock('@tet/api/collectivites', () => ({
  useCurrentCollectivite: vi.fn(),
}));

vi.mock('@/app/referentiels/use-action-commentaire', () => ({
  useActionCommentaire: vi.fn(),
  useSaveActionCommentaire: vi.fn(),
}));

vi.mock('@tet/ui', async () => {
  const actual = await vi.importActual('@tet/ui');
  return {
    ...actual,
    RichTextEditor: ({
      initialValue,
      disabled,
      placeholder,
      onChange,
    }: {
      initialValue?: string;
      disabled?: boolean;
      placeholder?: string;
      onChange: (value: string) => void;
    }) => (
      <textarea
        data-testid="rich-text-editor"
        defaultValue={initialValue}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
  };
});

import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  useActionCommentaire,
  useSaveActionCommentaire,
} from '@/app/referentiels/use-action-commentaire';

const mockUseCurrentCollectivite = useCurrentCollectivite as ReturnType<
  typeof vi.fn
>;
const mockUseActionCommentaire = useActionCommentaire as ReturnType<
  typeof vi.fn
>;
const mockUseSaveActionCommentaire = useSaveActionCommentaire as ReturnType<
  typeof vi.fn
>;

describe('ActionJustificationField', () => {
  const mockSaveActionCommentaire = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentCollectivite.mockReturnValue({
      collectiviteId: 1,
      hasCollectivitePermission: vi.fn().mockReturnValue(true),
    });
    mockUseActionCommentaire.mockReturnValue({
      actionCommentaire: null,
      isLoading: false,
    });
    mockUseSaveActionCommentaire.mockReturnValue({
      saveActionCommentaire: mockSaveActionCommentaire,
    });
  });

  it('should render rich text editor', () => {
    render(<ActionJustificationField actionId="test_action" />);

    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
  });

  it('should show default placeholder', () => {
    render(<ActionJustificationField actionId="test_action" />);

    expect(screen.getByPlaceholderText("Détaillez l'état d'avancement")).toBeInTheDocument();
  });

  it('should use custom placeholder when provided', () => {
    render(
      <ActionJustificationField
        actionId="test_action"
        placeholder="Custom placeholder"
      />
    );

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should render with title when provided', () => {
    render(
      <ActionJustificationField actionId="test_action" title="Test Title" />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render with hint when provided', () => {
    render(
      <ActionJustificationField actionId="test_action" hint="Test hint" />
    );

    expect(screen.getByText('Test hint')).toBeInTheDocument();
  });

  describe('initial value', () => {
    it('should load and display existing commentaire', () => {
      mockUseActionCommentaire.mockReturnValue({
        actionCommentaire: {
          commentaire: 'Existing comment',
        },
        isLoading: false,
      });

      render(<ActionJustificationField actionId="test_action" />);

      const editor = screen.getByTestId('rich-text-editor');
      expect(editor).toHaveValue('Existing comment');
    });

    it('should be empty when no commentaire exists', () => {
      mockUseActionCommentaire.mockReturnValue({
        actionCommentaire: null,
        isLoading: false,
      });

      render(<ActionJustificationField actionId="test_action" />);

      const editor = screen.getByTestId('rich-text-editor');
      expect(editor).toHaveValue('');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when user lacks permission', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        collectiviteId: 1,
        hasCollectivitePermission: vi.fn().mockReturnValue(false),
      });

      render(<ActionJustificationField actionId="test_action" />);

      expect(screen.getByTestId('rich-text-editor')).toBeDisabled();
    });

    it('should be disabled when loading', () => {
      mockUseActionCommentaire.mockReturnValue({
        actionCommentaire: null,
        isLoading: true,
      });

      render(<ActionJustificationField actionId="test_action" />);

      expect(screen.getByTestId('rich-text-editor')).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ActionJustificationField actionId="test_action" disabled />);

      expect(screen.getByTestId('rich-text-editor')).toBeDisabled();
    });

    it('should be enabled when user has permission and not loading', () => {
      mockUseCurrentCollectivite.mockReturnValue({
        collectiviteId: 1,
        hasCollectivitePermission: vi
          .fn()
          .mockImplementation((perm: string) => perm === 'referentiels.mutate'),
      });

      render(<ActionJustificationField actionId="test_action" />);

      expect(screen.getByTestId('rich-text-editor')).not.toBeDisabled();
    });
  });

  describe('saving behavior', () => {
    it('should call saveActionCommentaire when text changes', async () => {
      const user = userEvent.setup();
      render(<ActionJustificationField actionId="test_action" />);

      const editor = screen.getByTestId('rich-text-editor');
      await user.type(editor, 'New comment');

      await waitFor(() => {
        expect(mockSaveActionCommentaire).toHaveBeenCalled();
      });
    });

    it('should save with correct parameters', async () => {
      const user = userEvent.setup();
      render(<ActionJustificationField actionId="test_123" />);

      const editor = screen.getByTestId('rich-text-editor');
      await user.type(editor, 'Test');

      await waitFor(() => {
        expect(mockSaveActionCommentaire).toHaveBeenCalledWith({
          action_id: 'test_123',
          collectivite_id: 1,
          commentaire: expect.any(String),
        });
      });
    });
  });

  describe('re-rendering with different actionId', () => {
    it('should use actionId as key to reset state', () => {
      const { rerender } = render(
        <ActionJustificationField actionId="action_1" />
      );

      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();

      rerender(<ActionJustificationField actionId="action_2" />);

      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    });
  });

  describe('permission check', () => {
    it('should check for referentiels.mutate permission', () => {
      const mockHasPermission = vi.fn().mockReturnValue(true);
      mockUseCurrentCollectivite.mockReturnValue({
        collectiviteId: 1,
        hasCollectivitePermission: mockHasPermission,
      });

      render(<ActionJustificationField actionId="test_action" />);

      expect(mockHasPermission).toHaveBeenCalledWith('referentiels.mutate');
    });
  });

  describe('field className', () => {
    it('should apply custom className to Field component', () => {
      const { container } = render(
        <ActionJustificationField
          actionId="test_action"
          fieldClassName="custom-class"
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });
});