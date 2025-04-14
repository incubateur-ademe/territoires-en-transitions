import { ToolsAutomationApiConfigurationType } from '@/tools-automation-api/config/configuration.model';
import ConfigurationService from '@/tools-automation-api/config/configuration.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SireneService } from './sirene.service';

describe('SireneService', () => {
  let service: SireneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SireneService],
    })
    .useMocker((token) => {
      if (token === ConfigurationService) {
        return {
          get(key: keyof ToolsAutomationApiConfigurationType) {
            if (key === 'SIRENE_API_KEY') {
              return 'fake';
            }
            if (key === 'SIRENE_AUTH_URL') {
              return 'fake'
            }
            if (key === 'SIRENE_API_URL') {
              return 'fake'
            }
          },
        };
      }
    })
    .compile();

    service = module.get<SireneService>(SireneService);
  });

  // remplacer les valeurs `fake` dans le mock et enlever le `skip` pour éxécuter le test
  test.skip("Détermine le NIC du siège légal de chaque collectivité à partir de son SIREN.", async () => {
    const result = await service.getNIC(['200034825']);
    expect(result).toMatchObject([
      { siren: '200034825', nic: '00014' },
    ]);
  });
});
