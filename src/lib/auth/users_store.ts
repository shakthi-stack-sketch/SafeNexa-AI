import fs from 'fs';
import path from 'path';
import { User, UserRole, UserPublicProfile } from '../types';
import { hashPassword, verifyPassword } from './crypto';
import { getPrismaClient, isPostgresConfigured, checkPostgresHealth } from '../db/prisma';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

class UsersStore {
  private users: User[] = [];
  private isPostgresActive: boolean = false;
  private isInitializingPostgres: boolean = false;

  constructor() {
    // 1. Synchronous load from disk for instant response
    this.loadFromDisk();
    // 2. Asynchronously verify PostgreSQL
    this.initPostgresIfAvailable().catch((err) => {
      console.warn('[Dual-Mode Users] Non-fatal error initializing PostgreSQL for users:', err);
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
          last_login: u.last_login ? u.last_login.toISOString() : undefined,
        }));
        this.saveToDisk();
      } else if (dbUsers.length === 0 && this.users.length > 0) {
        // Seed empty PostgreSQL User table from memory
        for (const u of this.users) {
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
              last_login: u.last_login ? new Date(u.last_login) : null,
            },
          });
        }
      }

      return true;
    } catch (err) {
      console.warn('[Dual-Mode Users] Fallback to JSON users storage:', err);
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
      console.error('Failed to load users from disk:', err);
      this.users = [];
      this.seedInitialAccounts();
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save users to disk:', err);
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
    return this.users.find((u) => u.email.toLowerCase() === normalized);
  }

  public findById(id: string): User | undefined {
    this.loadFromDisk();
    return this.users.find((u) => u.id === id);
  }

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
      return { user: {} as UserPublicProfile, error: 'An account with this email already exists.' };
    }

    const { hash, salt } = hashPassword(params.password);
    const now = new Date().toISOString();
    const newUser: User = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: params.name.trim(),
      email: normalizedEmail,
      organization: params.organization.trim() || 'Oil India Limited',
      role: params.role,
      password_hash: hash,
      salt,
      created_at: now,
    };

    this.users.push(newUser);
    this.saveToDisk();

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        prisma.user
          .create({
            data: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              organization: newUser.organization,
              role: newUser.role,
              password_hash: newUser.password_hash,
              salt: newUser.salt,
              created_at: new Date(newUser.created_at),
            },
          })
          .catch((err) => console.warn('[Dual-Mode Users] Async user write to PostgreSQL failed:', err));
      }
    }

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

  public verifyCredentials(
    email: string,
    passwordPlain: string
  ): { user: UserPublicProfile; verified: boolean } | null {
    this.loadFromDisk();
    const user = this.findByEmail(email);
    if (!user) return null;

    const isMatch = verifyPassword(passwordPlain, user.password_hash, user.salt);
    if (!isMatch) return null;

    user.last_login = new Date().toISOString();
    this.saveToDisk();

    if (this.isPostgresActive) {
      const prisma = getPrismaClient();
      if (prisma) {
        prisma.user
          .update({
            where: { email: user.email },
            data: { last_login: new Date() },
          })
          .catch((err) => console.warn('[Dual-Mode Users] Async last_login update to PostgreSQL failed:', err));
      }
    }

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

// Global Singleton for Next.js server runtime
declare global {
  // eslint-disable-next-line no-var
  var __usersStore: UsersStore | undefined;
}

export const usersStore = global.__usersStore || new UsersStore();
global.__usersStore = usersStore;
