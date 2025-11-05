import { Test, TestingModule } from '@nestjs/testing';
import { ToolsAutomationApiConfigurationType } from '../config/configuration.model';
import ConfigurationService from '../config/configuration.service';
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
              if (key === 'SIRENE_API_KEY' || key === 'SIRENE_API_URL') {
                return process.env[key];
              }
              return 'fake';
            },
          };
        }
      })
      .compile();

    service = module.get<SireneService>(SireneService);
  });

  test('Détermine le NIC du siège légal de chaque collectivité à partir de son SIREN.', async () => {
    const result = await service.getNIC(['200034825']);
    expect(result).toMatchObject([{ siren: '200034825', nic: '00014' }]);
  });
});
