export const getFuse = async () => {
  const { default: Fuse } = await import('fuse.js');
  return Fuse;
};
