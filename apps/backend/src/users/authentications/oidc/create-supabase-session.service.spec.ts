import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { CreateSupabaseSessionService } from './create-supabase-session.service';

describe('CreateSupabaseSessionService — pont vers une session Supabase standard', () => {
  const generateLink = vi.fn();
  const supabaseServiceMock = {
    client: { auth: { admin: { generateLink } } },
  } as unknown as SupabaseService;

  const service = new CreateSupabaseSessionService(supabaseServiceMock);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('retourne le hashed_token de generateLink (aucun email envoyé)', async () => {
    generateLink.mockResolvedValue({
      data: {
        properties: { hashed_token: 'hashed-token-du-spike' },
        user: { id: 'user-1' },
      },
      error: null,
    });

    const result = await service.creerSession('agent@collectivite.fr');

    expect(generateLink).toHaveBeenCalledWith({
      type: 'magiclink',
      email: 'agent@collectivite.fr',
    });
    expect(result).toEqual({
      success: true,
      data: { hashedToken: 'hashed-token-du-spike' },
    });
  });

  test('erreur de generateLink → failure typée', async () => {
    generateLink.mockResolvedValue({
      data: { properties: null, user: null },
      error: { message: 'User not found' },
    });

    const result = await service.creerSession('inconnu@collectivite.fr');

    expect(result).toMatchObject({
      success: false,
      error: 'GENERATE_LINK_ERROR',
    });
  });

  test('réponse sans hashed_token → failure typée', async () => {
    generateLink.mockResolvedValue({
      data: { properties: {}, user: { id: 'user-1' } },
      error: null,
    });

    const result = await service.creerSession('agent@collectivite.fr');

    expect(result).toMatchObject({
      success: false,
      error: 'GENERATE_LINK_ERROR',
    });
  });
});
