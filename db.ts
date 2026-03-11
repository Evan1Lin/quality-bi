import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "quality_bi.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

// --- Schema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS quality_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
    customerName TEXT NOT NULL DEFAULT '未知客户',
    model TEXT NOT NULL DEFAULT '未知型号',
    cause TEXT NOT NULL DEFAULT '未分类',
    dept TEXT NOT NULL DEFAULT '未指定',
    productLine TEXT NOT NULL DEFAULT '其他配件',
    issueQuantity INTEGER NOT NULL DEFAULT 1,
    closed INTEGER NOT NULL DEFAULT 0 CHECK(closed IN (0, 1)),
    oob INTEGER NOT NULL DEFAULT 0 CHECK(oob IN (0, 1)),
    creator TEXT NOT NULL DEFAULT 'System',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_issues_month ON quality_issues(month);
  CREATE INDEX IF NOT EXISTS idx_issues_productLine ON quality_issues(productLine);
  CREATE INDEX IF NOT EXISTS idx_issues_cause ON quality_issues(cause);
  CREATE INDEX IF NOT EXISTS idx_issues_dept ON quality_issues(dept);
  CREATE INDEX IF NOT EXISTS idx_issues_oob ON quality_issues(oob);
  CREATE INDEX IF NOT EXISTS idx_issues_closed ON quality_issues(closed);
`);

// --- Types ---
export interface QualityIssue {
  id?: number;
  month: number;
  customerName: string;
  model: string;
  cause: string;
  dept: string;
  productLine: string;
  issueQuantity: number;
  closed: number;
  oob: number;
  creator: string;
  createdAt?: string;
}

export interface IssueFilters {
  month?: number | "all";
  productLine?: string;
  cause?: string;
  dept?: string;
  oob?: string; // 'all' | 'oobDamage' | 'nonOobDamage'
  search?: string;
}

// --- Query Helpers ---
function buildWhereClause(filters: IssueFilters) {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.month && filters.month !== "all") {
    conditions.push("month = ?");
    params.push(filters.month);
  }
  if (filters.productLine && filters.productLine !== "all") {
    conditions.push("productLine = ?");
    params.push(filters.productLine);
  }
  if (filters.cause && filters.cause !== "all") {
    conditions.push("cause = ?");
    params.push(filters.cause);
  }
  if (filters.dept && filters.dept !== "all") {
    conditions.push("dept = ?");
    params.push(filters.dept);
  }
  if (filters.oob && filters.oob !== "all") {
    if (filters.oob === "oobDamage") {
      conditions.push("oob >= 1");
    } else if (filters.oob === "nonOobDamage") {
      conditions.push("oob = 0");
    }
  }
  if (filters.search) {
    conditions.push("(model LIKE ? OR cause LIKE ? OR customerName LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

// --- CRUD Operations ---

/** Get all issues, optionally filtered */
export function getAllIssues(filters: IssueFilters = {}): QualityIssue[] {
  const { where, params } = buildWhereClause(filters);
  const stmt = db.prepare(`SELECT * FROM quality_issues ${where} ORDER BY id DESC`);
  return stmt.all(...params) as QualityIssue[];
}

/** Insert a single issue */
export function insertIssue(issue: Omit<QualityIssue, "id" | "createdAt">): QualityIssue {
  const stmt = db.prepare(`
    INSERT INTO quality_issues (month, customerName, model, cause, dept, productLine, issueQuantity, closed, oob, creator)
    VALUES (@month, @customerName, @model, @cause, @dept, @productLine, @issueQuantity, @closed, @oob, @creator)
  `);
  const result = stmt.run(issue);
  return { ...issue, id: result.lastInsertRowid as number } as QualityIssue;
}

/** Bulk insert issues using a transaction for performance */
export function bulkInsertIssues(issues: Omit<QualityIssue, "id" | "createdAt">[]): number {
  const stmt = db.prepare(`
    INSERT INTO quality_issues (month, customerName, model, cause, dept, productLine, issueQuantity, closed, oob, creator)
    VALUES (@month, @customerName, @model, @cause, @dept, @productLine, @issueQuantity, @closed, @oob, @creator)
  `);

  const insertMany = db.transaction((items: Omit<QualityIssue, "id" | "createdAt">[]) => {
    let count = 0;
    for (const item of items) {
      stmt.run(item);
      count++;
    }
    return count;
  });

  return insertMany(issues);
}

/** Delete all issues (reset) */
export function deleteAllIssues(): number {
  const result = db.prepare("DELETE FROM quality_issues").run();
  return result.changes;
}

/** Update an issue by id */
export function updateIssue(id: number, updates: Partial<Omit<QualityIssue, "id" | "createdAt">>): boolean {
  const fields = Object.keys(updates);
  if (fields.length === 0) return false;

  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");
  const stmt = db.prepare(`UPDATE quality_issues SET ${setClause} WHERE id = @id`);
  const result = stmt.run({ ...updates, id });
  return result.changes > 0;
}

/** Delete a single issue by id */
export function deleteIssue(id: number): boolean {
  const result = db.prepare("DELETE FROM quality_issues WHERE id = ?").run(id);
  return result.changes > 0;
}

/** Get aggregated KPI statistics */
export function getKPIStats(filters: IssueFilters = {}) {
  const { where, params } = buildWhereClause(filters);

  const row = db.prepare(`
    SELECT
      COALESCE(SUM(issueQuantity), 0) as totalIssues,
      COALESCE(SUM(CASE WHEN oob >= 1 THEN issueQuantity ELSE 0 END), 0) as oobIssues,
      COALESCE(SUM(CASE WHEN closed = 1 THEN issueQuantity ELSE 0 END), 0) as closedIssues,
      COALESCE(SUM(CASE WHEN closed = 0 THEN issueQuantity ELSE 0 END), 0) as overdueIssues,
      COUNT(*) as recordCount
    FROM quality_issues ${where}
  `).get(...params) as any;

  return {
    totalIssues: row.totalIssues,
    oobIssues: row.oobIssues,
    closedIssues: row.closedIssues,
    overdueIssues: row.overdueIssues,
    recordCount: row.recordCount,
    oobRate: row.totalIssues > 0 ? (row.oobIssues / row.totalIssues) * 100 : 0,
    closeRate: row.totalIssues > 0 ? (row.closedIssues / row.totalIssues) * 100 : 0,
    repairRate: (row.totalIssues / 2500) * 100,
  };
}

/** Get monthly trend data */
export function getTrendData(filters: IssueFilters = {}) {
  // Remove month filter for trend (we want all months)
  const trendFilters = { ...filters };
  delete trendFilters.month;
  const { where, params } = buildWhereClause(trendFilters);

  const rows = db.prepare(`
    SELECT
      month,
      COALESCE(SUM(issueQuantity), 0) as issues,
      COALESCE(SUM(CASE WHEN closed = 1 THEN issueQuantity ELSE 0 END), 0) as closedIssues,
      COUNT(*) as recordCount
    FROM quality_issues ${where}
    GROUP BY month
    ORDER BY month
  `).all(...params) as any[];

  // Fill all 12 months
  const result = [];
  for (let m = 1; m <= 12; m++) {
    const row = rows.find((r) => r.month === m);
    const issues = row ? row.issues : 0;
    const closedIssues = row ? row.closedIssues : 0;
    result.push({
      month: m,
      issues,
      closeRate: issues > 0 ? (closedIssues / issues) * 100 : 0,
      avgTime: issues > 0 ? 7 + Math.sin(m) * 3 : 0,
    });
  }
  return result;
}

/** Get model ranking */
export function getModelRanking(filters: IssueFilters = {}) {
  const { where, params } = buildWhereClause(filters);

  return db.prepare(`
    SELECT model as name, SUM(issueQuantity) as count
    FROM quality_issues ${where}
    GROUP BY model
    ORDER BY count DESC
    LIMIT 10
  `).all(...params);
}

/** Get cause distribution */
export function getCauseDistribution(filters: IssueFilters = {}) {
  const { where, params } = buildWhereClause(filters);
  const colors = ["#c2410c", "#d97706", "#475569", "#0071e3", "#1e3a8a", "#3b82f6", "#f59e0b"];

  const rows = db.prepare(`
    SELECT cause as name, SUM(issueQuantity) as value
    FROM quality_issues ${where}
    GROUP BY cause
    ORDER BY value DESC
    LIMIT 7
  `).all(...params) as any[];

  return rows.map((row, idx) => ({
    ...row,
    color: colors[idx % colors.length],
  }));
}

/** Get performance data grouped by creator */
export function getPerformanceData(filters: IssueFilters = {}) {
  const { where, params } = buildWhereClause(filters);

  return db.prepare(`
    SELECT creator as name, SUM(issueQuantity) as task
    FROM quality_issues ${where}
    GROUP BY creator
    ORDER BY task DESC
    LIMIT 5
  `).all(...params);
}

/** Close the database connection */
export function closeDB() {
  db.close();
}

export default db;
