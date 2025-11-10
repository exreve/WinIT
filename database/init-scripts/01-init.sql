-- Create application database
CREATE DATABASE winitdb;

-- Connect to the database
\c winitdb;

-- Create a simple test table for health checks
CREATE TABLE IF NOT EXISTS health_checks (
    id SERIAL PRIMARY KEY,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL
);

-- Create index for performance
CREATE INDEX idx_health_checks_checked_at ON health_checks(checked_at);

-- Insert a test record
INSERT INTO health_checks (status) VALUES ('initialized');

-- Grant permissions (if needed)
GRANT ALL PRIVILEGES ON DATABASE winitdb TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Display success message
SELECT 'Database initialization completed successfully!' AS message;

