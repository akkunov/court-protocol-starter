#!/bin/sh
set -eu

host="${DATABASE_HOST:-postgres}"
port="${DATABASE_PORT:-5432}"

until nc -z "$host" "$port"; do
  echo "Waiting for PostgreSQL at $host:$port..."
  sleep 2
done

echo "PostgreSQL is ready"
exec "$@"

