import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  postgresVerified: boolean | undefined;
};

/**
 * Checks whether DATABASE_URL is configured in the environment.
 */
export function isPostgresConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim().length > 0 && (url.startsWith('postgres://') || url.startsWith('postgresql://')));
}

/**
 * Returns a PrismaClient singleton instance if DATABASE_URL is configured,
 * otherwise returns null for graceful fallback to JSON storage.
 */
export function getPrismaClient(): PrismaClient | null {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (!globalForPrisma.prisma) {
    try {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    } catch (err) {
      console.warn('[Dual-Mode DB] Failed to instantiate PrismaClient. Operating in JSON fallback mode:', err);
      return null;
    }
  }

  return globalForPrisma.prisma;
}

/**
 * Performs a fast health check on the PostgreSQL connection.
 * Returns true if PostgreSQL is reachable, false otherwise.
 */
export async function checkPostgresHealth(): Promise<boolean> {
  const client = getPrismaClient();
  if (!client) return false;

  try {
    // 3-second timeout guard to prevent blocking
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PostgreSQL connection timed out')), 3000)
    );

    const pingPromise = client.$queryRaw`SELECT 1`;
    await Promise.race([pingPromise, timeoutPromise]);
    globalForPrisma.postgresVerified = true;
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Dual-Mode DB] PostgreSQL health check failed (${message}). Falling back to JSON storage.`);
    globalForPrisma.postgresVerified = false;
    return false;
  }
}

/**
 * Returns the current database status and mode for diagnostics & settings.
 */
export async function getDatabaseStatus(): Promise<{
  mode: 'postgresql' | 'json';
  configured: boolean;
  connected: boolean;
  provider: string;
  details: string;
}> {
  const configured = isPostgresConfigured();
  if (!configured) {
    return {
      mode: 'json',
      configured: false,
      connected: true, // JSON file storage is always locally available
      provider: 'Local JSON File Storage (data/database.json)',
      details: 'Operating in zero-dependency standalone mode. Add DATABASE_URL to .env to connect PostgreSQL.',
    };
  }

  const connected = await checkPostgresHealth();
  if (connected) {
    return {
      mode: 'postgresql',
      configured: true,
      connected: true,
      provider: 'PostgreSQL (Prisma ORM)',
      details: 'Connected to PostgreSQL database with active relational integrity.',
    };
  }

  return {
    mode: 'json',
    configured: true,
    connected: false,
    provider: 'Local JSON File Storage (Active Fallback)',
    details: 'DATABASE_URL is set but PostgreSQL host is unreachable. Operating in automatic JSON fallback mode.',
  };
}
