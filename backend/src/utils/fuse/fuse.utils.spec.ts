import { getFuse } from '@/backend/utils/fuse/fuse.utils';

test('should load Fuse', async () => {
  const Fuse = await getFuse();
  console.log(Fuse.version);
  expect(Fuse).toBeDefined();
});
