-- DeliDrone database initialization
CREATE DATABASE IF NOT EXISTS delidrone_auth;
CREATE DATABASE IF NOT EXISTS delidrone_users;
CREATE DATABASE IF NOT EXISTS delidrone_restaurants;
CREATE DATABASE IF NOT EXISTS delidrone_orders;
CREATE DATABASE IF NOT EXISTS delidrone_drones;
CREATE DATABASE IF NOT EXISTS delidrone_payments;
CREATE DATABASE IF NOT EXISTS delidrone_analytics;

-- Enable PostGIS for geo queries (optional, install extension if available)
-- \c delidrone_users
-- CREATE EXTENSION IF NOT EXISTS postgis;
