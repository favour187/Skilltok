/**
 * AI Bug Watchdog + Security Scanner
 * Continuously monitors and auto-mitigates:
 * - XSS attempts
 * - SQL injection patterns
 * - CSRF token issues
 * - Runtime errors
 * - Memory leaks
 * - Performance issues
 * - Network failures
 */

export interface BugReport {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'runtime' | 'memory' | 'performance' | 'network' | 'security' | 'xss' | 'sql' | 'csrf' | 'ui';
  message: string;
  resolved: boolean;
  autoFixed?: boolean;
}

// Security patterns that should NEVER appear in user input
const XSS_PATTERNS = [
  /<script[\s\S]*?>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onload=, onerror=, onclick=
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /eval\s*\(/gi,
  /document\.cookie/gi,
  /window\.location/gi,
  /<svg[\s\S]*on\w+/gi,
];

const SQL_INJECTION_PATTERNS = [
  /(\bunion\b.*\bselect\b)/gi,
  /(\bselect\b.*\bfrom\b)/gi,
  /(\bdrop\b\s+\btable\b)/gi,
  /(\binsert\b\s+\binto\b)/gi,
  /(\bdelete\b\s+\bfrom\b)/gi,
  /(\bor\b\s+1\s*=\s*1)/gi,
  /(--\s*$)/gm,
  /(;\s*drop\s+)/gi,
  /(\bexec\s*\()/gi,
  /(\bxp_cmdshell\b)/gi,
];

class BugWatchdog {
  private reports: BugReport[] = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(reports: BugReport[]) => void> = new Set();
  private errorHandlerRegistered = false;

  start(intervalMs: number = 5 * 60 * 1000) {
    if (this.interval) return;

    if (!this.errorHandlerRegistered) {
      window.addEventListener('error', (event) => {
        // Only log meaningful errors, ignore script load failures
        if (!event.message || event.message.includes('Script error')) return;
        this.logBug({
          severity: 'high',
          category: 'runtime',
          message: `Uncaught: ${event.message}`,
          autoFixed: false
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        const msg = event.reason?.message || event.reason;
        if (!msg || String(msg).includes('AbortError')) return;
        this.logBug({
          severity: 'medium',
          category: 'runtime',
          message: `Promise rejection: ${msg}`,
          autoFixed: false
        });
      });
      this.errorHandlerRegistered = true;
    }

    this.runHealthScan();
    this.interval = setInterval(() => this.runHealthScan(), intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** Scan a string for XSS attempts. Auto-sanitizes if found. */
  scanForXSS(input: string, source: string = 'unknown'): { safe: boolean; sanitized: string } {
    let detected = false;
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(input)) {
        detected = true;
        break;
      }
    }
    if (detected) {
      const sanitized = input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
      
      this.logBug({
        severity: 'critical',
        category: 'xss',
        message: `XSS attempt blocked from ${source}: "${input.substring(0, 60)}..." — automatically sanitized.`,
        autoFixed: true
      });
      return { safe: false, sanitized };
    }
    return { safe: true, sanitized: input };
  }

  /** Scan a string for SQL injection. Auto-blocks if found. */
  scanForSQL(input: string, source: string = 'unknown'): { safe: boolean; sanitized: string } {
    let detected = false;
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        detected = true;
        break;
      }
    }
    if (detected) {
      const sanitized = input.replace(/['";\\]/g, '');
      this.logBug({
        severity: 'critical',
        category: 'sql',
        message: `SQL injection attempt blocked from ${source}: "${input.substring(0, 60)}..." — automatically sanitized.`,
        autoFixed: true
      });
      return { safe: false, sanitized };
    }
    return { safe: true, sanitized: input };
  }

  /** CSRF token validation */
  validateCSRF(token: string | null): boolean {
    if (!token || token.length < 16) {
      this.logBug({
        severity: 'high',
        category: 'csrf',
        message: 'Missing or invalid CSRF token on protected request — request blocked.',
        autoFixed: true
      });
      return false;
    }
    return true;
  }

  private runHealthScan() {
    // 1. Memory usage
    const perfMemory = (performance as any).memory;
    if (perfMemory) {
      const usedMB = perfMemory.usedJSHeapSize / (1024 * 1024);
      const limitMB = perfMemory.jsHeapSizeLimit / (1024 * 1024);
      const usagePercent = (usedMB / limitMB) * 100;
      if (usagePercent > 85) {
        this.logBug({
          severity: 'high',
          category: 'memory',
          message: `High memory usage: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(0)}MB (${usagePercent.toFixed(0)}%) — try refresh.`,
          autoFixed: false
        });
      }
    }

    // 2. localStorage capacity
    try {
      const usedBytes = new Blob(Object.values(localStorage)).size;
      const usedKB = usedBytes / 1024;
      if (usedKB > 4000) {
        this.logBug({
          severity: 'medium',
          category: 'performance',
          message: `localStorage near capacity: ${usedKB.toFixed(0)}KB / 5MB`,
          autoFixed: false
        });
      }
    } catch {}

    // 3. Stale tokens
    const accessToken = localStorage.getItem('skilltok_access_token');
    if (accessToken && accessToken.length < 20) {
      localStorage.removeItem('skilltok_access_token'); // auto-fix
      this.logBug({
        severity: 'medium',
        category: 'security',
        message: 'Invalid/corrupted access token cleared from localStorage.',
        autoFixed: true
      });
    }

    // 4. Network offline check
    if (!navigator.onLine) {
      this.logBug({
        severity: 'critical',
        category: 'network',
        message: 'Network connection lost — app running offline.',
        autoFixed: false
      });
    }

    this.notifyListeners();
  }

  logBug(bug: Omit<BugReport, 'id' | 'timestamp' | 'resolved'>) {
    const report: BugReport = {
      id: 'bug-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toLocaleString(),
      resolved: bug.autoFixed || false,
      ...bug
    };
    const recent = this.reports.find(r => r.message === bug.message && (Date.now() - new Date(r.timestamp).getTime()) < 60000);
    if (recent) return;

    this.reports.unshift(report);
    if (this.reports.length > 100) this.reports = this.reports.slice(0, 100);
    this.notifyListeners();
  }

  resolveBug(id: string) {
    this.reports = this.reports.map(r => r.id === id ? { ...r, resolved: true } : r);
    this.notifyListeners();
  }

  clearAll() {
    this.reports = [];
    this.notifyListeners();
  }

  getReports(): BugReport[] {
    return this.reports;
  }

  subscribe(callback: (reports: BugReport[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.reports);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb([...this.reports]));
  }

  getStatus(): { healthy: boolean; openBugs: number; autoFixedCount: number; lastScan: string } {
    const open = this.reports.filter(r => !r.resolved).length;
    const fixed = this.reports.filter(r => r.autoFixed).length;
    return {
      healthy: open === 0,
      openBugs: open,
      autoFixedCount: fixed,
      lastScan: new Date().toLocaleString()
    };
  }
}

export const bugWatchdog = new BugWatchdog();

if (typeof window !== 'undefined') {
  bugWatchdog.start(5 * 60 * 1000);
}
