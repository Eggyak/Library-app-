import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(serverDirectory, '.env') });

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  AUTH_DISABLED: z.enum(['true', 'false']).default('false'),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  SUPER_ADMIN_LOGIN_ID: z.string().default(''),
  SUPER_ADMIN_PASSWORD: z.string().default(''),
  CORS_ORIGINS: z.string().default('http://localhost:5173,capacitor://localhost,https://localhost,http://localhost'),
  DATABASE_PATH: z.string().default('./data/library.sqlite'),
  GOOGLE_CLIENT_ID: z.string().default(''),
});

export function loadConfig(environment = process.env) {
  const parsed = configSchema.safeParse(environment);
  if (!parsed.success) {
    const details = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid server configuration: ${details}`);
  }

  const values = parsed.data;
  if (values.JWT_SECRET.toLowerCase().startsWith('replace-')) {
    throw new Error('JWT_SECRET still contains the example placeholder. Set a random secret of at least 32 characters.');
  }

  const databasePath = path.isAbsolute(values.DATABASE_PATH)
    ? values.DATABASE_PATH
    : path.resolve(serverDirectory, values.DATABASE_PATH);

  return {
    environment: values.NODE_ENV,
    port: values.PORT,
    authDisabled: values.AUTH_DISABLED === 'true',
    jwtSecret: values.JWT_SECRET,
    accessTokenTtl: values.ACCESS_TOKEN_TTL,
    refreshTokenDays: values.REFRESH_TOKEN_DAYS,
    superAdminLoginId: values.SUPER_ADMIN_LOGIN_ID.trim(),
    superAdminPassword: values.SUPER_ADMIN_PASSWORD,
    corsOrigins: values.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean),
    databasePath,
    version: '1.0.0',
    googleClientId: values.GOOGLE_CLIENT_ID,
  };
}

export { serverDirectory };
