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

// Prometheus query endpoint
fastify.get('/api/prometheus/query', async (request, reply) => {
  try {
    const { query } = request.query as { query?: string };
    if (!query) {
      reply.status(400);
      return { error: 'Query parameter is required' };
    }

    const prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus-operated.monitoring.svc.cluster.local:9090';
    const url = `${prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return { error: 'Failed to query Prometheus', message: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Prometheus query range endpoint (for graphs)
fastify.get('/api/prometheus/query_range', async (request, reply) => {
  try {
    const { query, start, end, step } = request.query as { 
      query?: string;
      start?: string;
      end?: string;
      step?: string;
    };
    
    if (!query) {
      reply.status(400);
      return { error: 'Query parameter is required' };
    }

    const prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus-operated.monitoring.svc.cluster.local:9090';
    const now = Math.floor(Date.now() / 1000);
    const startTime = start || String(now - 3600); // Default: last hour
    const endTime = end || String(now);
    const stepSize = step || '15'; // Default: 15 seconds
    
    const url = `${prometheusUrl}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${startTime}&end=${endTime}&step=${stepSize}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return { error: 'Failed to query Prometheus', message: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Get server metrics summary
fastify.get('/api/metrics/summary', async (request, reply) => {
  try {
    const prometheusUrl = process.env.PROMETHEUS_URL || 'http://prometheus-operated.monitoring.svc.cluster.local:9090';
    const now = Math.floor(Date.now() / 1000);
    const startTime = String(now - 3600); // Last hour
    
    // Query multiple metrics
    const queries = [
      'up{job="backend-service"}',
      'http_requests_total',
      'service_info',
    ];
    
    const results: Record<string, any> = {};
    
    for (const query of queries) {
      try {
        const url = `${prometheusUrl}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${startTime}&end=${now}&step=15`;
        const response = await fetch(url);
        const data = await response.json();
        results[query] = data;
      } catch (err) {
        fastify.log.error(`Failed to query ${query}: ${err instanceof Error ? err.message : String(err)}`);
        results[query] = { error: 'Query failed' };
      }
    }
    
    return results;
  } catch (error) {
    fastify.log.error(error);
    reply.status(500);
    return { error: 'Failed to fetch metrics summary', message: error instanceof Error ? error.message : 'Unknown error' };
  }
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

