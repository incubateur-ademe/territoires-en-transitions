const routeRoots = [
  'ajouter-collectivite',
  'banniere',
  'collectivite',
  'error',
  'finaliser-mon-inscription',
  'invitation',
  'login',
  'plans',
  'profil',
  'recherches',
  'recover',
  'rejoindre-une-collectivite',
  'signup',
];

const appPathPattern = new RegExp(`^/(?:${routeRoots.join('|')})(?=$|[/?#])`);

const noHardcodedAppPath = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Build internal app URLs with a builder exported from src/app/paths.ts',
    },
    schema: [],
    messages: {
      hardcodedAppPath:
        'Hardcoded internal app path. Use a URL builder from src/app/paths.ts (add one there if none fits).',
    },
  },
  create(context) {
    const reportIfAppPath = (node, pathStart) => {
      if (!appPathPattern.test(pathStart)) {
        return;
      }
      context.report({ node, messageId: 'hardcodedAppPath' });
    };

    return {
      Literal(node) {
        if (typeof node.value !== 'string') {
          return;
        }
        reportIfAppPath(node, node.value);
      },
      TemplateLiteral(node) {
        const [firstQuasi] = node.quasis;
        reportIfAppPath(node, firstQuasi.value.raw);
      },
    };
  },
};

export default noHardcodedAppPath;
