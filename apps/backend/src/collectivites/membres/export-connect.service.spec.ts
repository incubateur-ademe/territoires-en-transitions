import { Test, TestingModule } from "@nestjs/testing";
import { ExportConnectService } from "./export-connect.service";

const MEMBRE = {
  detailsFonction: 'détail fonction',
  nom: 'Test nom',
  prenom: 'Test prénom',
  telephone: 'Test tel',
  nic: '00000',
  siren: '000000000',
  email: 'test@email.fr',
  userId: '1',
  checksum: null,
  collectivite: 'Test collectivité',
  exportId: 'test@email.fr',
  fonction: null,
};
const CHECKSUM = '15617e2722f0f81de84707f7b9d02316';

describe('ExportConnectService', () => {
  let service: ExportConnectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportConnectService],
    })
    .useMocker(() => ({}))
    .compile();

    service = module.get<ExportConnectService>(ExportConnectService);
  });


  test('la somme de contrôle est constante entre 2 appels', () => {
    expect(service.getChecksum(MEMBRE)).toBe(CHECKSUM);
    expect(service.getChecksum(MEMBRE)).toBe(CHECKSUM);
  });

  test('la somme de contrôle change si un des champs sur laquelle elle est basée change', () => {
    expect(service.getChecksum(MEMBRE)).toBe(CHECKSUM);
    const newChecksum = '86358f7858e444158cdb7dac43ce61d6';
    expect(service.getChecksum({...MEMBRE, telephone: 'change'})).toBe(newChecksum);
  });
})
