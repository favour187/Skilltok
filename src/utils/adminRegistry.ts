/**
 * Multi-Admin Registry
 * Supports multiple admin accounts sharing the same passcode.
 * Tracks individual admin identities and activity for audit logs.
 */

export interface AdminAccount {
  id: string;
  alias: string;
  email: string;
  loginCount: number;
  lastLogin: string;
  active: boolean;
  ipAddress?: string;
}

const STORAGE_KEY = 'skilltok_admin_registry';

function loadAdmins(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default 3 admin slots
  return [
    { id: 'admin-1', alias: 'Chief Admin', email: 'admin1@skilltok.com', loginCount: 0, lastLogin: 'Never', active: false },
    { id: 'admin-2', alias: 'Co-Admin Alpha', email: 'admin2@skilltok.com', loginCount: 0, lastLogin: 'Never', active: false },
    { id: 'admin-3', alias: 'Co-Admin Beta', email: 'admin3@skilltok.com', loginCount: 0, lastLogin: 'Never', active: false }
  ];
}

function saveAdmins(admins: AdminAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(admins));
}

export const AdminRegistry = {
  list(): AdminAccount[] {
    return loadAdmins();
  },

  recordLogin(adminId: string): AdminAccount | null {
    const admins = loadAdmins();
    const found = admins.find(a => a.id === adminId);
    if (!found) return null;
    found.loginCount++;
    found.lastLogin = new Date().toLocaleString();
    found.active = true;
    saveAdmins(admins);
    return found;
  },

  logout(adminId: string): void {
    const admins = loadAdmins();
    const found = admins.find(a => a.id === adminId);
    if (found) {
      found.active = false;
      saveAdmins(admins);
    }
  },

  updateAlias(adminId: string, alias: string, email?: string): void {
    const admins = loadAdmins();
    const found = admins.find(a => a.id === adminId);
    if (found) {
      found.alias = alias;
      if (email) found.email = email;
      saveAdmins(admins);
    }
  },

  getActiveCount(): number {
    return loadAdmins().filter(a => a.active).length;
  }
};
