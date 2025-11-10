import Fastify from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import fastifyCors from '@fastify/cors';

const fastify = Fastify({
  logger: true,
});

// CORS - Allow all origins
fastify.register(fastifyCors, {
  origin: true, // Allow all origins
  credentials: true,
});

// PostgreSQL plugin
fastify.register(fastifyPostgres, {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'winitdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Health check route
fastify.get('/health', async (request, reply) => {
  try {
    // Execute SELECT 1; to check database connection
    const client = await fastify.pg.connect();
    await client.query('SELECT 1;');
    client.release();

    // As per requirement, return {success: false}
    // Note: In production, you'd typically return {success: true} on successful health check
    return { success: false };
  } catch (error) {
    fastify.log.error(error);
    reply.status(503);
    return { success: false, error: 'Database connection failed' };
  }
});

// Prometheus metrics endpoint (simple format)
fastify.get('/metrics', async (request, reply) => {
  reply.type('text/plain');
  // Simple Prometheus metrics format
  return `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/"} 1
http_requests_total{method="GET",endpoint="/health"} 1
http_requests_total{method="GET",endpoint="/metrics"} 1

# HELP service_info Service information
# TYPE service_info gauge
service_info{version="1.0.0",name="winit-backend"} 1
`;
});

// Root endpoint
fastify.get('/', async (request, reply) => {
  return { 
    service: 'WinIT Backend API',
    version: '1.0.0',
    status: 'running'
  };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

