export const swaggerConfig = {
  openapi: {
    info: {
      title: 'Esports Tournament API',
      description:
        'RESTful API para gestión de torneos de esports y videojuegos competitivos. Permite crear torneos, registrar equipos, generar brackets automáticos, reportar resultados y gestionar clasificaciones.',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@esports-tournament.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.esports-tournament.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Games', description: 'Game management endpoints' },
      { name: 'Game Accounts', description: 'User game account linking' },
      { name: 'Tournaments', description: 'Tournament management endpoints' },
      { name: 'Teams', description: 'Team management endpoints' },
      { name: 'Matches', description: 'Match management endpoints' },
      { name: 'Players', description: 'Player statistics endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'ERROR_CODE' },
                message: { type: 'string', example: 'Error message' },
                details: { type: 'object', nullable: true },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 150 },
            totalPages: { type: 'number', example: 8 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
};
