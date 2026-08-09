#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 \
     --username "$POSTGRES_USER" \
     --dbname   "$POSTGRES_DB" <<-SQL
    -- Required by TypeORM's @PrimaryGeneratedColumn('uuid') default expression.
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Non-superuser role used by the application at runtime.
    -- Superusers bypass RLS; app_user does not, so Postgres enforces
    -- the principal_scope policy on every SELECT against policies.
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_DB_USER}') THEN
        CREATE ROLE "${APP_DB_USER}" WITH LOGIN PASSWORD '${APP_DB_PASSWORD}';
      END IF;
    END \$\$;

    GRANT CONNECT ON DATABASE "${POSTGRES_DB}" TO "${APP_DB_USER}";
    GRANT USAGE, CREATE ON SCHEMA public TO "${APP_DB_USER}";
SQL
