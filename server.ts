import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import * as XLSX from "xlsx";
import dotenv from "dotenv";

import {
  getAllIssues,
  insertIssue,
  bulkInsertIssues,
  deleteAllIssues,
  updateIssue,
  deleteIssue,
  getKPIStats,
  getTrendData,
  getModelRanking,
  getCauseDistribution,
  getPerformanceData,
  type QualityIssue,
  type IssueFilters,
} from "./db.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer for file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

export async function startServer(portOverride?: number): Promise<number> {
  const app = express();
  const PORT = portOverride || parseInt(process.env.PORT || "3000", 10);

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // ===================== API Routes =====================

  /** Health check */
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Quality BI Backend is running", timestamp: new Date().toISOString() });
  });

  /** GET /api/issues — Query issues with optional filters */
  app.get("/api/issues", (req, res) => {
    try {
      const filters: IssueFilters = {
        month: req.query.month ? (req.query.month === "all" ? "all" : parseInt(req.query.month as string, 10)) : "all",
        productLine: (req.query.productLine as string) || "all",
        cause: (req.query.cause as string) || "all",
        dept: (req.query.dept as string) || "all",
        oob: (req.query.oob as string) || "all",
        search: (req.query.search as string) || undefined,
      };
      const issues = getAllIssues(filters);
      res.json({ success: true, data: issues, total: issues.length });
    } catch (error: any) {
      console.error("GET /api/issues error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** POST /api/issues — Insert a single issue */
  app.post("/api/issues", (req, res) => {
    try {
      const issue = insertIssue(req.body);
      res.json({ success: true, data: issue });
    } catch (error: any) {
      console.error("POST /api/issues error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** POST /api/issues/bulk — Bulk insert issues */
  app.post("/api/issues/bulk", (req, res) => {
    try {
      const issues: Omit<QualityIssue, "id" | "createdAt">[] = req.body;
      if (!Array.isArray(issues) || issues.length === 0) {
        return res.status(400).json({ success: false, error: "请提供一个非空的数据数组" });
      }
      const count = bulkInsertIssues(issues);
      res.json({ success: true, inserted: count });
    } catch (error: any) {
      console.error("POST /api/issues/bulk error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** PUT /api/issues/:id — Update a single issue */
  app.put("/api/issues/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = updateIssue(id, req.body);
      if (updated) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: "记录未找到" });
      }
    } catch (error: any) {
      console.error("PUT /api/issues error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** DELETE /api/issues — Delete all issues (reset) */
  app.delete("/api/issues", (_req, res) => {
    try {
      const deleted = deleteAllIssues();
      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error("DELETE /api/issues error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** DELETE /api/issues/:id — Delete a single issue */
  app.delete("/api/issues/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = deleteIssue(id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: "记录未找到" });
      }
    } catch (error: any) {
      console.error("DELETE /api/issues/:id error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** GET /api/kpi — Get KPI aggregated stats */
  app.get("/api/kpi", (req, res) => {
    try {
      const filters: IssueFilters = {
        month: req.query.month ? (req.query.month === "all" ? "all" : parseInt(req.query.month as string, 10)) : "all",
        productLine: (req.query.productLine as string) || "all",
        cause: (req.query.cause as string) || "all",
        dept: (req.query.dept as string) || "all",
        oob: (req.query.oob as string) || "all",
      };
      const stats = getKPIStats(filters);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error("GET /api/kpi error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** GET /api/trend — Get monthly trend data */
  app.get("/api/trend", (req, res) => {
    try {
      const filters: IssueFilters = {
        productLine: (req.query.productLine as string) || "all",
        cause: (req.query.cause as string) || "all",
        dept: (req.query.dept as string) || "all",
        oob: (req.query.oob as string) || "all",
      };
      const trend = getTrendData(filters);
      res.json({ success: true, data: trend });
    } catch (error: any) {
      console.error("GET /api/trend error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** GET /api/ranking — Get model ranking */
  app.get("/api/ranking", (req, res) => {
    try {
      const filters: IssueFilters = {
        month: req.query.month ? (req.query.month === "all" ? "all" : parseInt(req.query.month as string, 10)) : "all",
        productLine: (req.query.productLine as string) || "all",
        cause: (req.query.cause as string) || "all",
        dept: (req.query.dept as string) || "all",
        oob: (req.query.oob as string) || "all",
      };
      const ranking = getModelRanking(filters);
      res.json({ success: true, data: ranking });
    } catch (error: any) {
      console.error("GET /api/ranking error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** GET /api/distribution — Get cause distribution */
  app.get("/api/distribution", (req, res) => {
    try {
      const filters: IssueFilters = {
        month: req.query.month ? (req.query.month === "all" ? "all" : parseInt(req.query.month as string, 10)) : "all",
        productLine: (req.query.productLine as string) || "all",
        cause: (req.query.cause as string) || "all",
        dept: (req.query.dept as string) || "all",
        oob: (req.query.oob as string) || "all",
      };
      const dist = getCauseDistribution(filters);
      res.json({ success: true, data: dist });
    } catch (error: any) {
      console.error("GET /api/distribution error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** GET /api/performance — Get performance data */
  app.get("/api/performance", (req, res) => {
    try {
      const filters: IssueFilters = {
        month: req.query.month ? (req.query.month === "all" ? "all" : parseInt(req.query.month as string, 10)) : "all",
        productLine: (req.query.productLine as string) || "all",
        cause: (req.query.cause as string) || "all",
        dept: (req.query.dept as string) || "all",
        oob: (req.query.oob as string) || "all",
      };
      const perf = getPerformanceData(filters);
      res.json({ success: true, data: perf });
    } catch (error: any) {
      console.error("GET /api/performance error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** POST /api/import — Server-side Excel import */
  app.post("/api/import", upload.single("file"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "请上传 Excel 文件" });
      }

      const wb = XLSX.read(req.file.buffer, { type: "buffer" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData: any[] = XLSX.utils.sheet_to_json(ws);

      const processedData = rawData.map((row) => {
        let month = 1;
        if (row["创建时间"]) {
          const date = new Date(row["创建时间"]);
          if (!isNaN(date.getTime())) month = date.getMonth() + 1;
        }

        return {
          month,
          customerName: row["客户名称"] || row["标题"] || row["标题_1"] || "未知客户",
          model: row["产品型号"] || "未知型号",
          cause: row["根因分类"] || "未分类",
          dept: row["产品归属"] || "未指定",
          productLine: row["问题分析"] || "其他配件",
          issueQuantity: Number(row["问题数量"]) || 1,
          closed: row["是否完成"] === "是" || row["是否完成"] === true || row["是否完成"] === "Y" ? 1 : 0,
          oob: row["是否开箱损"] === "是" || row["是否开箱损"] === true || row["是否开箱损"] === "开箱损问题" ? 1 : 0,
          creator: row["创建人"] || "System",
        };
      });

      const count = bulkInsertIssues(processedData);
      res.json({ success: true, inserted: count, message: `成功导入 ${count} 条数据` });
    } catch (error: any) {
      console.error("POST /api/import error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** GET /api/export — Export data as Excel file */
  app.get("/api/export", (req, res) => {
    try {
      const filters: IssueFilters = {
        month: req.query.month ? (req.query.month === "all" ? "all" : parseInt(req.query.month as string, 10)) : "all",
        productLine: (req.query.productLine as string) || "all",
        cause: (req.query.cause as string) || "all",
        dept: (req.query.dept as string) || "all",
        oob: (req.query.oob as string) || "all",
      };
      const issues = getAllIssues(filters);

      // Map to Chinese headers for export
      const exportData = issues.map((row) => ({
        月份: row.month,
        客户名称: row.customerName,
        产品型号: row.model,
        根因分类: row.cause,
        产品归属: row.dept,
        问题分析: row.productLine,
        问题数量: row.issueQuantity,
        是否完成: row.closed ? "是" : "否",
        是否开箱损: row.oob ? "是" : "否",
        创建人: row.creator,
        创建时间: row.createdAt,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws["!cols"] = [
        { wch: 6 },  // 月份
        { wch: 20 }, // 客户名称
        { wch: 18 }, // 产品型号
        { wch: 22 }, // 根因分类
        { wch: 20 }, // 产品归属
        { wch: 15 }, // 问题分析
        { wch: 8 },  // 问题数量
        { wch: 8 },  // 是否完成
        { wch: 10 }, // 是否开箱损
        { wch: 12 }, // 创建人
        { wch: 20 }, // 创建时间
      ];

      XLSX.utils.book_append_sheet(wb, ws, "质量数据");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      const filename = `质量数据报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
    } catch (error: any) {
      console.error("GET /api/export error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ===================== Vite / Static =====================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  return new Promise<number>((resolve, reject) => {
    const server = app.listen(PORT, "0.0.0.0", () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : PORT;
      console.log(`✅ Quality BI Server running on http://localhost:${actualPort}`);
      resolve(actualPort);
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} in use, trying ${PORT + 1}...`);
        server.close();
        startServer(PORT + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

// Auto-start when run directly (not imported by Electron)
const isMainModule = !process.env.ELECTRON_RUN_AS_NODE && process.argv[1] && (
  process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')
);
if (isMainModule) {
  startServer();
}
