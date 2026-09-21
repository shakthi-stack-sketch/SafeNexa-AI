import fs from 'fs';
import path from 'path';
import { User, UserRole, UserPublicProfile } from '../types';
import { hashPassword, verifyPassword } from './crypto';
import {
  getPrismaClient,
  isPostgresConfigured,
  checkPostgresHealth,
} from '../db/prisma';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

class UsersStore {
  private users: User[] = [];
  private isPostgresActive = false;
  private isInitializingPostgres = false;

  constructor() {
    this.loadFromDisk();

    this.initPostgresIfAvailable().catch((err) => {
      console.warn(
        '[UsersStore] PostgreSQL initialization failed:',
        err
      );
    });
  }

  public async initPostgresIfAvailable(): Promise<boolean> {
    if (!isPostgresConfigured() || this.isInitializingPostgres) {
      return this.isPostgresActive;
    }

    this.isInitializingPostgres = true;

    try {
      const isHealthy = await checkPostgresHealth();

      if (!isHealthy) {
        this.isPostgresActive = false;
        return false;
      }

      const prisma = getPrismaClient();

      if (!prisma) {
        this.isPostgresActive = false;
        return false;
      }

      this.isPostgresActive = true;

      const dbUsers = await prisma.user.findMany();

      if (dbUsers.length > 0) {
        this.users = dbUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          organization: u.organization,
          role: u.role as UserRole,
          password_hash: u.password_hash,
          salt: u.salt,
          created_at: u.created_at.toISOString(),
          last_login: u.last_login
            ? u.last_login.toISOString()
            : undefined,
        }));

        this.saveToDisk();
      } else if (this.users.length > 0) {
        // Only seed PostgreSQL if it is completely empty.
        for (const u of this.users) {
          try {
            await prisma.user.create({
              data: {
                id: u.id,
                name: u.name,
                email: u.email,
                organization: u.organization,
                role: u.role,
                password_hash: u.password_hash,
                salt: u.salt,
                created_at: new Date(u.created_at),
                last_login: u.last_login
                  ? new Date(u.last_login)
                  : null,
              },
            });
          } catch (error) {
            console.warn(
              '[UsersStore] Could not seed user:',
              u.email,
              error
            );
          }
        }
      }

      return true;
    } catch (err) {
      console.warn(
        '[UsersStore] PostgreSQL initialization error:',
        err
      );

      this.isPostgresActive = false;
      return false;
    } finally {
      this.isInitializingPostgres = false;
    }
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        this.users = JSON.parse(raw);
      } else {
        this.users = [];
        this.seedInitialAccounts();
        this.saveToDisk();
      }
    } catch (err) {
      console.error('[UsersStore] Failed to load users:', err);

      this.users = [];
      this.seedInitialAccounts();
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(this.users, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('[UsersStore] Failed to save users:', err);
    }
  }

  private seedInitialAccounts(): void {
    const defaultPassword = 'Safenexa@2026';
    const now = new Date().toISOString();

    const adminHash = hashPassword(defaultPassword);
    const managerHash = hashPassword(defaultPassword);
    const officerHash = hashPassword(defaultPassword);

    this.users = [
      {
        id: 'USR-ADM-01',
        name: 'HSE Lead Administrator',
        email: 'admin@safenexa.com',
        organization: 'Oil India Limited',
        role: 'Administrator',
        password_hash: adminHash.hash,
        salt: adminHash.salt,
        created_at: now,
      },
      {
        id: 'USR-MGR-02',
        name: 'Operations HSE Manager',
        email: 'manager@safenexa.com',
        organization: 'Oil India Limited',
        role: 'HSE Manager',
        password_hash: managerHash.hash,
        salt: managerHash.salt,
        created_at: now,
      },
      {
        id: 'USR-OFF-03',
        name: 'Field HSE Officer',
        email: 'officer@safenexa.com',
        organization: 'Oil India Limited',
        role: 'HSE Officer',
        password_hash: officerHash.hash,
        salt: officerHash.salt,
        created_at: now,
      },
    ];
  }

  public findByEmail(email: string): User | undefined {
    if (!email) return undefined;

    this.loadFromDisk();

    const normalized = email.trim().toLowerCase();

    return this.users.find(
      (u) => u.email.toLowerCase() === normalized
    );
  }

  public findById(id: string): User | undefined {
    this.loadFromDisk();

    return this.users.find((u) => u.id === id);
  }

  /*
   * Legacy local-storage method.
   * Kept so existing parts of SafeNexa do not break.
   */
  public createUser(params: {
    name: string;
    email: string;
    organization: string;
    role: UserRole;
    password: string;
  }): { user: UserPublicProfile; error?: string } {
    this.loadFromDisk();

    const normalizedEmail = params.email.trim().toLowerCase();

    if (this.findByEmail(normalizedEmail)) {
      return {
        user: {} as UserPublicProfile,
        error: 'An account with this email already exists.',
      };
    }

    const { hash, salt } = hashPassword(params.password);
    const now = new Date().toISOString();

    const newUser: User = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: params.name.trim(),
      email: normalizedEmail,
      organization:
        params.organization.trim() || 'Oil India Limited',
      role: params.role,
      password_hash: hash,
      salt,
      created_at: now,
    };

    this.users.push(newUser);
    this.saveToDisk();

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        organization: newUser.organization,
        role: newUser.role,
        created_at: newUser.created_at,
      },
    };
  }

  /*
   * Production signup.
   * Neon PostgreSQL is the source of truth.
   */
  public async createUserInPostgres(params: {
    name: string;
    email: string;
    organization: string;
    role: UserRole;
    password: string;
  }): Promise<{ user: UserPublicProfile; error?: string }> {
    try {
      const prisma = getPrismaClient();

      if (!prisma) {
        return {
          user: {} as UserPublicProfile,
          error: 'Database connection is unavailable.',
        };
      }

      const normalizedEmail = params.email.trim().toLowerCase();

      const existingUser = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (existingUser) {
        return {
          user: {} as UserPublicProfile,
          error: 'An account with this email already exists.',
        };
      }

      const { hash, salt } = hashPassword(params.password);
      const now = new Date();

      const newUser = await prisma.user.create({
        data: {
          name: params.name.trim(),
          email: normalizedEmail,
          organization:
            params.organization.trim() || 'Oil India Limited',
          role: params.role,
          password_hash: hash,
          salt,
          created_at: now,
        },
      });

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          organization: newUser.organization,
          role: newUser.role as UserRole,
          created_at: newUser.created_at.toISOString(),
        },
      };
    } catch (error) {
      console.error(
        '[UsersStore] PostgreSQL signup failed:',
        error
      );

      return {
        user: {} as UserPublicProfile,
        error: 'Unable to create the account. Please try again.',
      };
    }
  }

  /*
   * Production login.
   * Reads directly from Neon PostgreSQL.
   */
  public async verifyCredentialsInPostgres(
    email: string,
    passwordPlain: string
  ): Promise<{
    user: UserPublicProfile;
    verified: boolean;
  } | null> {
    try {
      const prisma = getPrismaClient();

      if (!prisma) {
        console.error(
          '[UsersStore] PostgreSQL client unavailable.'
        );
        return null;
      }

      const normalizedEmail = email.trim().toLowerCase();

      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (!user) {
        return null;
      }

      const isMatch = verifyPassword(
        passwordPlain,
        user.password_hash,
        user.salt
      );

      if (!isMatch) {
        return null;
      }

      const lastLogin = new Date();

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          last_login: lastLogin,
        },
      });

      return {
        verified: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          role: user.role as UserRole,
          created_at: user.created_at.toISOString(),
        },
      };
    } catch (error) {
      console.error(
        '[UsersStore] PostgreSQL login failed:',
        error
      );

      return null;
    }
  }

  /*
   * Legacy local verification.
   * Kept for compatibility with any existing code.
   */
  public verifyCredentials(
    email: string,
    passwordPlain: string
  ): {
    user: UserPublicProfile;
    verified: boolean;
  } | null {
    this.loadFromDisk();

    const user = this.findByEmail(email);

    if (!user) return null;

    const isMatch = verifyPassword(
      passwordPlain,
      user.password_hash,
      user.salt
    );

    if (!isMatch) return null;

    user.last_login = new Date().toISOString();

    this.saveToDisk();

    return {
      verified: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        created_at: user.created_at,
      },
    };
  }

  public getAllPublicProfiles(): UserPublicProfile[] {
    this.loadFromDisk();

    return this.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      organization: u.organization,
      role: u.role,
      created_at: u.created_at,
    }));
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __usersStore: UsersStore | undefined;
}

export const usersStore =
  global.__usersStore || new UsersStore();

global.__usersStore = usersStore;