/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Factory, 
  BellRing, 
  Settings, 
  Download, 
  AlertTriangle, 
  RefreshCw, 
  Search,
  ArrowUp,
  ArrowDown,
  BarChart3,
  PieChart,
  History,
  ChevronDown,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Clock,
  Users,
  Target,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie,
  LineChart,
  Line,
  ReferenceLine,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Mock Data based on User's Jan 2026 Excel ---

const MOCK_DATA = [];

const TREND_HISTORY = [
  { month: 'Sep 2025', issues: 12, closeRate: 85, avgTime: 9.2 },
  { month: 'Oct 2025', issues: 28, closeRate: 65, avgTime: 9.0 },
  { month: 'Nov 2025', issues: 22, closeRate: 72, avgTime: 9.4 },
  { month: 'Dec 2025', issues: 12, closeRate: 58, avgTime: 10.3 },
  { month: 'Jan 2026', issues: 21, closeRate: 52, avgTime: 10.7 },
  { month: 'Feb 2026', issues: 16, closeRate: 63, avgTime: 8.4 },
  { month: 'Mar 2026', issues: 8, closeRate: 88, avgTime: 10.4 },
];

const PERFORMANCE_DATA = [
  { name: 'Ian Li', task: 12, speed: 4.2 },
  { name: 'Colin Gu', task: 15, speed: 3.8 },
  { name: 'Jasper Ou', task: 8, speed: 5.1 },
  { name: 'Alen', task: 10, speed: 4.5 },
  { name: 'Rock Wen', task: 6, speed: 6.2 },
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
      active ? "sidebar-item-active text-slate-900" : "text-slate-500 hover:bg-slate-100"
    )}
  >
    <Icon size={20} />
    <span className="text-sm font-medium text-left">{label}</span>
  </button>
);

const KPICard = ({ title, value, target, trend, trendValue, color = "slate" }: any) => (
  <div className="apple-card p-4 flex flex-col justify-between min-h-[140px]">
    <div className="flex justify-between items-start">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      {target && <span className="text-[10px] text-slate-400">{target}</span>}
    </div>
    <h2 className={cn("text-3xl font-bold tracking-tight mt-2", color === "rose" ? "text-rose-600" : "text-slate-900")}>
      {value}
    </h2>
    <div className="mt-2">
      {trend && (
        <p className="text-[10px] flex items-center gap-1 text-slate-500">
          {trend === "up" ? <ArrowUp size={12} className="text-emerald-600" /> : <ArrowDown size={12} className="text-rose-600" />}
          {trendValue}
        </p>
      )}
      {!trend && trendValue && <p className="text-[10px] text-slate-500">{trendValue}</p>}
    </div>
  </div>
);

const TRANSLATIONS: Record<string, any> = {
  '中': {
    title: '质量管理驾驶舱',
    subtitle: '制造决策支持平台',
    overview: '总览',
    trend: '趋势分析',
    production: '生产看板',
    performance: '绩效看板',
    data: '详细数据',
    importExcel: '导入表格',
    exportReport: '导出报表',
    riskWarning: '风险预警',
    resetData: '重置数据',
    monthlyIssues: '月度问题总数',
    oobRate: 'OOB 合规率',
    repairRate: '累计返修率',
    closeRate: '问题关闭率',
    overdue: '逾期未闭环',
    target: '目标',
    benchmark: '基准',
    sla: 'SLA: 7天',
    unprocessed: '未处理 > 7天',
    filter: '数据筛选',
    timeRange: '时间范围',
    productLine: '产品线',
    rootCause: '根因分类',
    dept: '产品归属',
    oobStatus: 'OOB 状态',
    ranking: '产品问题数量分布',
    distribution: '根因分布 TOP 7',
    emergency: '紧急风险预警',
    all: '全部',
    days7: '7天',
    days30: '30天',
    days180: '180天',
    days365: '365天',
    roboticArm: '机械臂',
    robot: '机器人',
    joint: '关节',
    others: '其他配件',
    pkgTrans: '包装与运输类原因',
    material: '物料与来料类原因',
    field: '现场应用与环境类原因',
    assembly: '生产装配与工艺类原因',
    maint: '维护与操作类原因',
    design: '设计开发类原因',
    req: '需求类问题',
    deptRuiJu: '睿矩产品研发中心',
    deptWeiHan: '微悍产品研发中心',
    deptRuiYou: '睿友产品研发中心',
    deptAdv: '先进制造与工业化中心',
    oobDamage: '开箱损',
    nonOobDamage: '非开箱损',
    issueCount: '问题数量',
    oobAbnormal: 'OOB 异常',
    trendTitle: '月度问题趋势 (含目标线)',
    closeRateTrend: '问题关闭率趋势',
    avgTimeTrend: '平均处理时长趋势',
    prodAbnormal: '生产异常总数',
    highFreq: '高频故障型号',
    mainCause: '主要根因分类',
    prodAssembly: '生产装配异常',
    modelDist: '产品型号故障分布',
    causeDepth: '故障类型深度分析',
    teamEff: '团队处理效率',
    avgResp: '平均响应速度 (天)',
    todoAlert: '待办预警 (Top 5)',
    rawJanData: '原始质量数据',
    searchPlaceholder: '搜索型号、根因...',
    model: '产品型号',
    count: '数量',
    status: '状态',
    closed: '已闭环',
    processing: '处理中',
    oobDmgLabel: '开箱损',
    nonOobDmgLabel: '非开箱损',
    month: '月份',
    jan: '1月',
    feb: '2月',
    mar: '3月',
    apr: '4月',
    may: '5月',
    jun: '6月',
    jul: '7月',
    aug: '8月',
    sep: '9月',
    oct: '10月',
    nov: '11月',
    dec: '12月',
    vsLastMonth: '较上月',
    customerName: '客户名称',
    coverage: '覆盖',
    models: '个产品型号',
    ratio: '占比',
    brand: '质量智能 BI',
    cases: '起'
  },
  'EN': {
    title: 'Quality Management Cockpit',
    subtitle: 'Manufacturing Decision Support Platform',
    overview: 'Overview',
    trend: 'Trend Analysis',
    production: 'Production Dashboard',
    performance: 'Performance Dashboard',
    data: 'Detailed Data',
    importExcel: 'Import Excel',
    exportReport: 'Export Report',
    riskWarning: 'Risk Warning',
    resetData: 'Reset Data',
    monthlyIssues: 'Monthly Total Issues',
    oobRate: 'OOB Compliance Rate',
    repairRate: 'Total Repair Rate',
    closeRate: 'Issue Close Rate',
    overdue: 'Overdue Unclosed',
    target: 'Target',
    benchmark: 'Benchmark',
    sla: 'SLA: 7 Days',
    unprocessed: 'Unprocessed > 7 Days',
    filter: 'Data Filter',
    timeRange: 'Time Range',
    productLine: 'Product Line',
    rootCause: 'Root Cause',
    dept: 'Department',
    oobStatus: 'OOB Status',
    ranking: 'Product Issue Quantity Distribution',
    distribution: 'Root Cause TOP 7',
    emergency: 'Emergency Alerts',
    all: 'All',
    days7: '7 Days',
    days30: '30 Days',
    days180: '180 Days',
    days365: '365 Days',
    roboticArm: 'Robotic Arm',
    robot: 'Robot',
    joint: 'Joint',
    others: 'Other Accessories',
    pkgTrans: 'Packaging & Transport',
    material: 'Material & Incoming',
    field: 'Field Application & Env',
    assembly: 'Production Assembly & Process',
    maint: 'Maintenance & Operation',
    design: 'Design & Development',
    req: 'Requirement Issues',
    deptRuiJu: 'RuiJu R&D Center',
    deptWeiHan: 'WeiHan R&D Center',
    deptRuiYou: 'RuiYou R&D Center',
    deptAdv: 'Adv Manufacturing Center',
    oobDamage: 'OOB Damage',
    nonOobDamage: 'Non-OOB Damage',
    issueCount: 'Issue Quantity',
    oobAbnormal: 'OOB Abnormal',
    trendTitle: 'Monthly Issue Trend (with Target)',
    closeRateTrend: 'Close Rate Trend',
    avgTimeTrend: 'Avg Processing Time Trend',
    prodAbnormal: 'Total Prod Anomalies',
    highFreq: 'High Freq Failure Model',
    mainCause: 'Main Root Cause',
    prodAssembly: 'Prod Assembly Anomaly',
    modelDist: 'Model Failure Dist',
    causeDepth: 'Cause Depth Analysis',
    teamEff: 'Team Efficiency',
    avgResp: 'Avg Response (Days)',
    todoAlert: 'Todo Alerts (Top 5)',
    rawJanData: 'Jan 2026 Raw Data',
    searchPlaceholder: 'Search model, cause...',
    model: 'Model',
    count: 'Count',
    status: 'Status',
    closed: 'Closed',
    processing: 'Processing',
    oobDmgLabel: 'OOB Dmg',
    nonOobDmgLabel: 'Non-OOB',
    month: 'Month',
    jan: 'Jan',
    feb: 'Feb',
    mar: 'Mar',
    apr: 'Apr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    aug: 'Aug',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dec: 'Dec',
    vsLastMonth: 'vs Last Month',
    customerName: 'Customer Name',
    coverage: 'Coverage',
    models: 'Models',
    ratio: 'Ratio',
    brand: 'Quality BI',
    cases: 'Cases'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lang, setLang] = useState<'中' | 'EN'>('中');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(1);
  const [selectedProductLine, setSelectedProductLine] = useState<string>('all');
  const [selectedCause, setSelectedCause] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedOob, setSelectedOob] = useState<string>('all');
  const [data, setData] = useState<any[]>(MOCK_DATA);
  const t = (key: string) => TRANSLATIONS[lang][key] || key;
  const [importStatus, setImportStatus] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isLoading, setIsLoading] = useState(false);

  // Load data from backend on mount
  const loadDataFromBackend = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/issues');
      const result = await res.json();
      if (result.success && result.data.length > 0) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Failed to load data from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Health check
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setBackendStatus('online');
          // Load persisted data
          loadDataFromBackend();
        } else {
          setBackendStatus('offline');
        }
      })
      .catch(() => setBackendStatus('offline'));
  }, []);

  // --- Computed Data ---
  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchMonth = selectedMonth === 'all' || d.month === selectedMonth;
      const matchProductLine = selectedProductLine === 'all' || d.productLine === t(selectedProductLine) || d.productLine === selectedProductLine;
      const matchCause = selectedCause === 'all' || d.cause === t(selectedCause) || d.cause === selectedCause;
      const matchDept = selectedDept === 'all' || d.dept === t(selectedDept) || d.dept === selectedDept;
      const matchOob = selectedOob === 'all' || (selectedOob === 'oobDamage' ? d.oob >= 1 : d.oob === 0);
      return matchMonth && matchProductLine && matchCause && matchDept && matchOob;
    });
  }, [selectedMonth, selectedProductLine, selectedCause, selectedDept, selectedOob, data, lang]);

  const kpiStats = useMemo(() => {
    const filterByMonth = (dList: any[], month: number | 'all') => {
      return dList.filter(d => {
        const matchMonth = month === 'all' || d.month === month;
        const matchProductLine = selectedProductLine === 'all' || d.productLine === t(selectedProductLine) || d.productLine === selectedProductLine;
        const matchCause = selectedCause === 'all' || d.cause === t(selectedCause) || d.cause === selectedCause;
        const matchDept = selectedDept === 'all' || d.dept === t(selectedDept) || d.dept === selectedDept;
        const matchOob = selectedOob === 'all' || (selectedOob === 'oobDamage' ? d.oob >= 1 : d.oob === 0);
        return matchMonth && matchProductLine && matchCause && matchDept && matchOob;
      });
    };

    const currData = filterByMonth(data, selectedMonth);
    
    // Calculate current metrics
    const currTotalIssues = currData.reduce((acc, d) => acc + (d.issueQuantity || 0), 0);
    const currOobIssues = currData.filter(d => (d.oob || 0) >= 1).reduce((acc, d) => acc + (d.issueQuantity || 0), 0);
    const currClosedIssues = currData.filter(d => d.closed === 1).reduce((acc, d) => acc + (d.issueQuantity || 0), 0);
    const currOverdue = currData.filter(d => d.closed === 0).reduce((acc, d) => acc + (d.issueQuantity || 0), 0);
    
    const currOobRate = currTotalIssues > 0 ? (currOobIssues / currTotalIssues) * 100 : 0;
    const currCloseRate = currTotalIssues > 0 ? (currClosedIssues / currTotalIssues) * 100 : 0;
    const currRepairRate = (currTotalIssues / 2500) * 100;

    // Calculate previous metrics for trend
    let prevData: any[] = [];
    if (selectedMonth === 'all') {
      prevData = [];
    } else {
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      prevData = filterByMonth(data, prevMonth);
    }

    const prevTotalIssues = prevData.reduce((acc, d) => acc + (d.issueQuantity || 0), 0);
    const prevOobIssues = prevData.filter(d => (d.oob || 0) >= 1).reduce((acc, d) => acc + (d.issueQuantity || 0), 0);
    const prevClosedIssues = prevData.filter(d => d.closed === 1).reduce((acc, d) => acc + (d.issueQuantity || 0), 0);
    const prevOverdue = prevData.filter(d => d.closed === 0).reduce((acc, d) => acc + (d.issueQuantity || 0), 0);

    const prevOobRate = prevTotalIssues > 0 ? (prevOobIssues / prevTotalIssues) * 100 : 0;
    const prevCloseRate = prevTotalIssues > 0 ? (prevClosedIssues / prevTotalIssues) * 100 : 0;
    const prevRepairRate = (prevTotalIssues / 2500) * 100;

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return { direction: 'up' as const, value: curr > 0 ? '+100%' : '0%' };
      const diff = curr - prev;
      const pct = (diff / prev) * 100;
      return {
        direction: diff >= 0 ? 'up' as const : 'down' as const,
        value: `${diff >= 0 ? '+' : ''}${pct.toFixed(1)}%`
      };
    };

    return {
      issues: { val: currTotalIssues, trend: calcTrend(currTotalIssues, prevTotalIssues) },
      oob: { val: currOobRate.toFixed(2) + '%', trend: calcTrend(currOobRate, prevOobRate) },
      repair: { val: currRepairRate.toFixed(2) + '%', trend: calcTrend(currRepairRate, prevRepairRate) },
      close: { val: currCloseRate.toFixed(1) + '%', trend: calcTrend(currCloseRate, prevCloseRate) },
      overdue: { val: currOverdue, trend: calcTrend(currOverdue, prevOverdue) }
    };
  }, [selectedMonth, selectedProductLine, selectedCause, selectedDept, selectedOob, data, lang]);

  const dynamicTrendHistory = useMemo(() => {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return months.map((m, idx) => {
      const monthData = data.filter(d => {
        const matchMonth = d.month === m;
        const matchProductLine = selectedProductLine === 'all' || d.productLine === t(selectedProductLine) || d.productLine === selectedProductLine;
        const matchCause = selectedCause === 'all' || d.cause === t(selectedCause) || d.cause === selectedCause;
        const matchDept = selectedDept === 'all' || d.dept === t(selectedDept) || d.dept === selectedDept;
        const matchOob = selectedOob === 'all' || (selectedOob === 'oobDamage' ? d.oob >= 1 : d.oob === 0);
        return matchMonth && matchProductLine && matchCause && matchDept && matchOob;
      });
      
      const totalIssues = monthData.reduce((acc, d) => acc + (d.issueQuantity || 0), 0);
      const closedIssues = monthData.filter(d => d.closed === 1).reduce((acc, d) => acc + (d.issueQuantity || 0), 0);
      const closeRate = totalIssues > 0 ? (closedIssues / totalIssues) * 100 : 0;
      
      return {
        month: t(monthKeys[idx]),
        issues: totalIssues,
        closeRate: closeRate,
        avgTime: totalIssues > 0 ? 7 + Math.sin(m) * 3 : 0
      };
    });
  }, [data, selectedProductLine, selectedCause, selectedDept, selectedOob, lang]);

  const dynamicPerformanceData = useMemo(() => {
    const creators: Record<string, { task: number, speed: number }> = {};
    filteredData.forEach(d => {
      const creator = d.creator || 'System';
      if (!creators[creator]) creators[creator] = { task: 0, speed: 4 + Math.random() * 2 };
      creators[creator].task += d.issueQuantity;
    });
    
    const result = Object.entries(creators).map(([name, stats]) => ({
      name,
      task: stats.task,
      speed: stats.speed
    })).sort((a, b) => b.task - a.task).slice(0, 5);

    return result.length > 0 ? result : PERFORMANCE_DATA;
  }, [filteredData]);

  const modelRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(d => {
      counts[d.model] = (counts[d.model] || 0) + d.issueQuantity;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, value: (count / 10) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredData]);

  const causeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(d => {
      counts[d.cause] = (counts[d.cause] || 0) + d.issueQuantity;
    });
    const colors = ['#c2410c', '#d97706', '#475569', '#0071e3', '#1e3a8a', '#3b82f6', '#f59e0b'];
    return Object.entries(counts)
      .map(([name, value], idx) => ({ name, value, color: colors[idx % colors.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [filteredData]);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);
        
        // Map fields based on user's Excel image and requirements
        const processedData = rawData.map(row => {
          let month = 1;
          if (row['创建时间']) {
            const date = new Date(row['创建时间']);
            if (!isNaN(date.getTime())) month = date.getMonth() + 1;
          }

          return {
            month,
            customerName: row['客户名称'] || row['标题'] || row['标题_1'] || '未知客户',
            model: row['产品型号'] || '未知型号',
            cause: row['根因分类'] || '未分类',
            dept: row['产品归属'] || '未指定',
            productLine: row['问题分析'] || '其他配件',
            issueQuantity: Number(row['问题数量']) || 1,
            closed: row['是否完成'] === '是' || row['是否完成'] === true || row['是否完成'] === 'Y' ? 1 : 0,
            oob: row['是否开箱损'] === '是' || row['是否开箱损'] === true || row['是否开箱损'] === '开箱损问题' ? 1 : 0,
            creator: row['创建人'] || 'System'
          };
        });

        // Update frontend state immediately
        setData(prev => [...prev, ...processedData]);

        // Persist to backend
        if (backendStatus === 'online') {
          try {
            const res = await fetch('/api/issues/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(processedData),
            });
            const result = await res.json();
            if (result.success) {
              // Reload from backend to get IDs
              await loadDataFromBackend();
              setImportStatus({ show: true, message: `成功导入 ${result.inserted} 条数据并已持久化`, type: 'success' });
            } else {
              setImportStatus({ show: true, message: `导入成功但持久化失败: ${result.error}`, type: 'error' });
            }
          } catch {
            setImportStatus({ show: true, message: `导入成功（数据已显示），但后端保存失败`, type: 'error' });
          }
        } else {
          setImportStatus({ show: true, message: `成功导入 ${processedData.length} 条数据（仅前端，后端离线）`, type: 'success' });
        }
      } catch (error) {
        setImportStatus({ show: true, message: '导入失败，请检查文件格式', type: 'error' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportStatus(prev => ({ ...prev, show: false })), 3000);
    };
    reader.readAsBinaryString(file);
  };

  const handleReset = async () => {
    setData([]);
    // Clear backend data
    if (backendStatus === 'online') {
      try {
        await fetch('/api/issues', { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to reset backend data:', err);
      }
    }
    setImportStatus({ show: true, message: t('resetData'), type: 'success' });
    setTimeout(() => setImportStatus(prev => ({ ...prev, show: false })), 3000);
  };

  const handleExport = () => {
    // Build query params from current filters
    const params = new URLSearchParams();
    if (selectedMonth !== 'all') params.set('month', String(selectedMonth));
    if (selectedProductLine !== 'all') params.set('productLine', selectedProductLine);
    if (selectedCause !== 'all') params.set('cause', selectedCause);
    if (selectedDept !== 'all') params.set('dept', selectedDept);
    if (selectedOob !== 'all') params.set('oob', selectedOob);
    window.open(`/api/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light">
      {/* Notifications */}
      {importStatus.show && (
        <div className={cn(
          "fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border animate-in fade-in slide-in-from-top-4 duration-300",
          importStatus.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
        )}>
          {importStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="text-xs font-semibold">{importStatus.message}</span>
          <button onClick={() => setImportStatus(prev => ({ ...prev, show: false }))} className="ml-2 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white/50 backdrop-blur-xl flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <BarChart3 size={20} />
            </div>
            <span className="text-xl font-semibold tracking-tight">{t('brand')}</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem icon={LayoutDashboard} label={t('overview')} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={TrendingUp} label={t('trend')} active={activeTab === 'trend'} onClick={() => setActiveTab('trend')} />
          <SidebarItem icon={Factory} label={t('production')} active={activeTab === 'production'} onClick={() => setActiveTab('production')} />
          <SidebarItem icon={BellRing} label={t('performance')} active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} />
          <SidebarItem icon={Settings} label={t('data')} active={activeTab === 'data'} onClick={() => setActiveTab('data')} />
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg">
            <div className={cn(
              "size-2 rounded-full",
              backendStatus === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
              backendStatus === 'checking' ? "bg-amber-400 animate-pulse" : "bg-rose-500"
            )} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Backend: {backendStatus}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        {/* Header */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {activeTab === 'overview' && t('title')}
              {activeTab === 'trend' && t('trend')}
              {activeTab === 'production' && t('production')}
              {activeTab === 'performance' && t('performance')}
              {activeTab === 'data' && t('data')}
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-medium">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-md text-xs font-medium text-white hover:bg-primary/90 transition-colors shadow-sm">
              <FileSpreadsheet size={14} /> {t('importExcel')}
            </button>
            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 rounded-md text-xs font-medium text-white hover:bg-amber-600 transition-colors shadow-sm">
              <RefreshCw size={14} /> {t('resetData')}
            </button>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <Download size={14} /> {t('exportReport')}
            </button>
            <div className="flex items-center ml-4 bg-white border border-slate-200 rounded-md p-0.5 text-[10px] font-medium shadow-sm overflow-hidden">
              <button onClick={() => setLang('EN')} className={cn("px-2 py-1 transition-colors", lang === 'EN' ? "bg-slate-100 text-primary" : "text-slate-400")}>EN</button>
              <span className="text-slate-200">|</span>
              <button onClick={() => setLang('中')} className={cn("px-2 py-1 transition-colors", lang === '中' ? "bg-slate-100 text-primary" : "text-slate-400")}>中</button>
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <KPICard title={t('monthlyIssues')} value={kpiStats.issues.val} trend={kpiStats.issues.trend.direction} trendValue={`${t('vsLastMonth')} ${kpiStats.issues.trend.value}`} />
              <KPICard title={t('oobRate')} value={kpiStats.oob.val} trend={kpiStats.oob.trend.direction} trendValue={`${t('vsLastMonth')} ${kpiStats.oob.trend.value}`} />
              <KPICard title={t('repairRate')} value={kpiStats.repair.val} trend={kpiStats.repair.trend.direction} trendValue={`${t('vsLastMonth')} ${kpiStats.repair.trend.value}`} />
              <KPICard title={t('closeRate')} value={kpiStats.close.val} trend={kpiStats.close.trend.direction} trendValue={`${t('vsLastMonth')} ${kpiStats.close.trend.value}`} />
              <KPICard title={t('overdue')} value={kpiStats.overdue.val} trend={kpiStats.overdue.trend.direction} trendValue={`${t('vsLastMonth')} ${kpiStats.overdue.trend.value}`} color="rose" />
            </div>

            <div className="apple-card p-4 mb-6">
              <div className="flex items-center gap-2 mb-3 text-primary text-xs font-semibold"><Search size={14} /> {t('filter')}</div>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 ml-1">{t('month')}</label>
                  <div className="relative">
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md text-xs h-8 pl-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="all">{t('all')}</option>
                      <option value="1">{t('jan')}</option>
                      <option value="2">{t('feb')}</option>
                      <option value="3">{t('mar')}</option>
                      <option value="4">{t('apr')}</option>
                      <option value="5">{t('may')}</option>
                      <option value="6">{t('jun')}</option>
                      <option value="7">{t('jul')}</option>
                      <option value="8">{t('aug')}</option>
                      <option value="9">{t('sep')}</option>
                      <option value="10">{t('oct')}</option>
                      <option value="11">{t('nov')}</option>
                      <option value="12">{t('dec')}</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 ml-1">{t('productLine')}</label>
                  <div className="relative">
                    <select 
                      value={selectedProductLine}
                      onChange={(e) => setSelectedProductLine(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md text-xs h-8 pl-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="all">{t('all')}</option>
                      <option value="roboticArm">{t('roboticArm')}</option>
                      <option value="robot">{t('robot')}</option>
                      <option value="joint">{t('joint')}</option>
                      <option value="others">{t('others')}</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 ml-1">{t('rootCause')}</label>
                  <div className="relative">
                    <select 
                      value={selectedCause}
                      onChange={(e) => setSelectedCause(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md text-xs h-8 pl-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="all">{t('all')}</option>
                      <option value="pkgTrans">{t('pkgTrans')}</option>
                      <option value="material">{t('material')}</option>
                      <option value="field">{t('field')}</option>
                      <option value="assembly">{t('assembly')}</option>
                      <option value="maint">{t('maint')}</option>
                      <option value="design">{t('design')}</option>
                      <option value="req">{t('req')}</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 ml-1">{t('dept')}</label>
                  <div className="relative">
                    <select 
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md text-xs h-8 pl-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="all">{t('all')}</option>
                      <option value="deptRuiJu">{t('deptRuiJu')}</option>
                      <option value="deptWeiHan">{t('deptWeiHan')}</option>
                      <option value="deptRuiYou">{t('deptRuiYou')}</option>
                      <option value="deptAdv">{t('deptAdv')}</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 ml-1">{t('oobStatus')}</label>
                  <div className="relative">
                    <select 
                      value={selectedOob}
                      onChange={(e) => setSelectedOob(e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-md text-xs h-8 pl-2 pr-8 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="all">{t('all')}</option>
                      <option value="oobDamage">{t('oobDamage')}</option>
                      <option value="nonOobDamage">{t('nonOobDamage')}</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="apple-card p-5">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-6"><BarChart3 size={16} className="text-amber-500" /> {t('ranking')}</h3>
                <div className="space-y-5">
                  {modelRanking.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium"><span>{item.name}</span><span>{t('issueCount')}: {item.count}</span></div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-slate-700 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(item.count * 10, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="apple-card p-5">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-6"><PieChart size={16} className="text-primary" /> {t('distribution')}</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={causeDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                        {causeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {causeDistribution.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[9px]">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 truncate">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'trend' && (
          <div className="space-y-6">
            <div className="apple-card p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> {t('trendTitle')}</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dynamicTrendHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <ReferenceLine y={50} label={{ position: 'right', value: `${t('target')} (50)`, fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="issues" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 4, fill: '#1e3a8a' }} activeDot={{ r: 6 }} name={t('monthlyIssues')} />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="apple-card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> {t('closeRateTrend')}</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dynamicTrendHistory}>
                      <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                      <Tooltip />
                      <Area type="monotone" dataKey="closeRate" stroke="#10b981" fillOpacity={1} fill="url(#colorClose)" strokeWidth={2} name={t('closeRate')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="apple-card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2"><Clock size={16} className="text-amber-500" /> {t('avgTimeTrend')}</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dynamicTrendHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip />
                      <ReferenceLine y={7} label={{ position: 'right', value: t('sla'), fill: '#f59e0b', fontSize: 10 }} stroke="#f59e0b" strokeDasharray="3 3" />
                      <Line type="step" dataKey="avgTime" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} name={t('avgResp')} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'production' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="apple-card p-4 bg-slate-900 text-white">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('prodAbnormal')}</p>
                <h2 className="text-4xl font-bold mt-2">37</h2>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
                  <Layers size={12} /> {t('coverage')} {new Set(filteredData.map(d => d.model)).size} {t('models')}
                </div>
              </div>
              <div className="apple-card p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('highFreq')}</p>
                <h2 className="text-2xl font-bold mt-2 text-slate-900">{modelRanking[0]?.name || '-'}</h2>
                <p className="text-[10px] text-rose-500 mt-1 font-bold">{t('issueCount')}: {modelRanking[0]?.count || 0}</p>
              </div>
              <div className="apple-card p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('mainCause')}</p>
                <h2 className="text-2xl font-bold mt-2 text-slate-900">{causeDistribution[0]?.name || '-'}</h2>
                <p className="text-[10px] text-amber-600 mt-1 font-bold">{t('ratio')}: {filteredData.length > 0 ? ((causeDistribution[0]?.value / filteredData.reduce((acc, d) => acc + d.issueQuantity, 0)) * 100).toFixed(1) : 0}%</p>
              </div>
              <div className="apple-card p-4">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('prodAssembly')}</p>
                <h2 className="text-2xl font-bold mt-2 text-slate-900">{filteredData.filter(d => d.cause === t('assembly') || d.cause === '生产装配与工艺类原因').length} {t('cases')}</h2>
                <p className="text-[10px] text-emerald-600 mt-1 font-bold">{t('closed')}: {filteredData.filter(d => d.cause === t('assembly') || d.cause === '生产装配与工艺类原因').length > 0 ? (filteredData.filter(d => (d.cause === t('assembly') || d.cause === '生产装配与工艺类原因') && d.closed === 1).length / filteredData.filter(d => d.cause === t('assembly') || d.cause === '生产装配与工艺类原因').length * 100).toFixed(0) : 100}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="apple-card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-6">{t('modelDist')}</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelRanking} layout="vertical" margin={{ left: 40 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="apple-card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-6">{t('causeDepth')}</h3>
                <div className="space-y-4">
                  {causeDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-24 text-[10px] text-slate-500 font-medium truncate">{item.name}</div>
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(item.value / 10) * 100}%`, backgroundColor: item.color }} />
                      </div>
                      <div className="w-8 text-[10px] font-bold text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="apple-card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2"><Users size={16} className="text-primary" /> {t('teamEff')}</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dynamicPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="task" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('issueCount')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="apple-card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2"><Target size={16} className="text-emerald-500" /> {t('avgResp')}</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dynamicPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="speed" fill="#10b981" radius={[4, 4, 0, 0]} name={t('avgResp')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="apple-card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2"><BellRing size={16} className="text-rose-500" /> {t('todoAlert')}</h3>
                <div className="space-y-4">
                  {dynamicPerformanceData.sort((a, b) => b.task - a.task).map((person, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">{person.name[0]}</div>
                        <span className="text-xs font-medium text-slate-700">{person.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-900">{person.task} {t('issueCount')}</p>
                        <p className="text-[8px] text-rose-500">3 {t('overdue')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="apple-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900">{t('rawJanData')}</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder={t('searchPlaceholder')} className="pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 w-64" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4 border-b border-slate-100">{t('customerName')}</th>
                    <th className="px-6 py-4 border-b border-slate-100">{t('model')}</th>
                    <th className="px-6 py-4 border-b border-slate-100">{t('rootCause')}</th>
                    <th className="px-6 py-4 border-b border-slate-100">{t('issueCount')}</th>
                    <th className="px-6 py-4 border-b border-slate-100">{t('status')}</th>
                    <th className="px-6 py-4 border-b border-slate-100">{t('oobStatus')}</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-600">
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 border-b border-slate-50 font-medium text-slate-900">{row.customerName}</td>
                      <td className="px-6 py-4 border-b border-slate-50 font-medium text-slate-900">{row.model}</td>
                      <td className="px-6 py-4 border-b border-slate-50">{row.cause}</td>
                      <td className="px-6 py-4 border-b border-slate-50">{row.issueQuantity}</td>
                      <td className="px-6 py-4 border-b border-slate-50">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", row.closed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                          {row.closed ? t('closed') : t('processing')}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-slate-50">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", row.oob ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400")}>
                          {row.oob ? t('oobDmgLabel') : t('nonOobDmgLabel')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
