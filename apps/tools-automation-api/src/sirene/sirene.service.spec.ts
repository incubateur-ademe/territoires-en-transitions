import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { SireneService } from './sirene.service';

describe('SireneService', () => {
  let service: SireneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<SireneService>(SireneService);
  });

  test('Détermine le NIC du siège légal de chaque collectivité à partir de son SIREN.', async () => {
    const result = await service.getNIC(['200034825']);
    expect(result).toMatchObject([{ siren: '200034825', nic: '00014' }]);
  });
});
