export default ({ env }) => ({
  'react-icons': true,
  'strapi-backup-plugin': {
    enabled: true,
    config: {
      paths: [
        './public/uploads', // usual
        './config', // if database file is there
        './data', // or wherever your .sqlite file is
        './.tmp',
      ],
      database: {
        type: 'sqlite',
        databaseDriver: 'sqlite',
        filePath: './.tmp/data.db', // Path to your SQLite database
      },
      include: {
        files: true, // include public/uploads
        database: true,
      },
      errorHandler: (error, strapi) => {
        console.log(error);
      },
    },
  },
});
