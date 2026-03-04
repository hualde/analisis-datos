import { useState, useMemo, useEffect, useRef } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
  PieChart, Pie, Legend
} from "recharts";
import { Upload, FileSpreadsheet, CheckCircle2, TrendingUp, AlertTriangle, FileText, ChevronRight, Filter, Copy } from "lucide-react";
import { processExcelData, processExcelArrayBuffer, COLORS, SEGMENTOS, TRAMO_COLORS, getFamily } from "./utils";
import { toPng } from "html-to-image";

const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const ALL_MONTHS_KEY = "ALL";
const ALL_MONTHS_LABEL = "Todos";

const getBaseUrl = () => {
  const envBase = import.meta?.env?.BASE_URL;
  let basePath = "/";
  if (envBase && envBase !== "/") {
    basePath = envBase.endsWith("/") ? envBase : `${envBase}/`;
  } else if (typeof window !== "undefined") {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length > 0) {
      basePath = `/${parts[0]}/`;
    }
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${basePath}`;
  }
  return basePath;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const seg = SEGMENTOS[d.riesgo] || {};
  return (
    <div style={{ background: "#1a2a3a", border: `1px solid ${COLORS.borde}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: COLORS.blanco, fontWeight: 700, marginBottom: 4, fontFamily: "monospace" }}>{d.articulo}</div>
      {d.blacklisted && (
        <div style={{ color: COLORS.critico, fontWeight: 700, marginBottom: 4 }}>
          Lista negra
        </div>
      )}
      <div style={{ color: COLORS.gris }}>Cascos: <b style={{ color: COLORS.blanco }}>{d.cascos}</b></div>
      <div style={{ color: COLORS.gris }}>Tasa rechazo: <b style={{ color: seg.color || COLORS.blanco }}>{Number(d.tasa_pct).toFixed(1)}%</b></div>
      <div style={{ color: COLORS.gris }}>Valor rechazo: <b style={{ color: COLORS.blanco }}>{Number(d.valor_rechazo).toFixed(2)}€</b></div>
      <div style={{ marginTop: 4, color: seg.color || COLORS.gris, fontSize: 11 }}>{seg.emoji} {d.riesgo}</div>
    </div>
  );
};

const normalizeRef = (value) => String(value || "").trim().toUpperCase();

const extractBlacklistRefs = (json) => {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const keys = ["blacklist", "listaNegra", "refs", "referencias"];
    for (const key of keys) {
      if (Array.isArray(json[key])) return json[key];
    }
  }
  return [];
};

const avgRate = 23.35;

const applyDerivedFields = (row) => {
  const next = { ...row };
  if (next.cascos <= 5 && next.tasa_pct > 50) {
    next.riesgo = "Crítico (≤5 cascos, >50%)";
  } else if (next.cascos <= 20 && next.tasa_pct > avgRate) {
    next.riesgo = "Baja prod, alto rechazo";
  } else if (next.cascos > 20 && next.tasa_pct > avgRate) {
    next.riesgo = "Alta prod, alto rechazo";
  } else {
    next.riesgo = "Bajo rechazo";
  }

  if (next.cascos <= 5) next.tramo = "1-5 cascos";
  else if (next.cascos <= 10) next.tramo = "6-10 cascos";
  else if (next.cascos <= 20) next.tramo = "11-20 cascos";
  else if (next.cascos <= 50) next.tramo = "21-50 cascos";
  else next.tramo = ">50 cascos";

  next.familia = getFamily(next.articulo);
  return next;
};

const aggregateByReferencia = (rows) => {
  const byRef = new Map();
  rows.forEach((row) => {
    const key = normalizeRef(row.articulo);
    if (!key) return;
    if (!byRef.has(key)) {
      byRef.set(key, {
        articulo: row.articulo,
        cascos: 0,
        rechazo_uds: 0,
        valor_rechazo: 0,
        devueltos: 0,
        tasa_sum: 0,
        tasa_count: 0,
      });
    }
    const acc = byRef.get(key);
    acc.cascos += row.cascos || 0;
    acc.rechazo_uds += row.rechazo_uds || 0;
    acc.valor_rechazo += row.valor_rechazo || 0;
    acc.devueltos += row.devueltos || 0;
    if (typeof row.tasa_pct === "number") {
      acc.tasa_sum += row.tasa_pct;
      acc.tasa_count += 1;
    }
  });

  return Array.from(byRef.values())
    .map((row) => {
      const tasa = row.tasa_count > 0 ? row.tasa_sum / row.tasa_count : 0;
      return applyDerivedFields({
        articulo: row.articulo,
        cascos: row.cascos,
        rechazo_uds: row.rechazo_uds,
        valor_rechazo: row.valor_rechazo,
        devueltos: row.devueltos,
        tasa_pct: tasa,
      });
    })
    .filter((d) => d.cascos > 0 && d.articulo !== "" && d.articulo !== "0");
};

const normalizeOklchColors = (root) => {
  const colorProps = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "textDecorationColor",
    "fill",
    "stroke",
    "stopColor",
  ];
  const dummy = document.createElement("div");
  dummy.style.position = "fixed";
  dummy.style.left = "-99999px";
  dummy.style.top = "-99999px";
  document.body.appendChild(dummy);

  const elements = [root, ...root.querySelectorAll("*")];
  elements.forEach((el) => {
    const computed = getComputedStyle(el);
    colorProps.forEach((prop) => {
      const val = computed[prop];
      if (val && val.includes("oklch(")) {
        dummy.style[prop] = val;
        const normalized = getComputedStyle(dummy)[prop];
        if (normalized && !normalized.includes("oklch(")) {
          el.style[prop] = normalized;
        }
      }
    });
  });

  document.body.removeChild(dummy);
};

const createCaptureNode = (element) => {
  const rect = element.getBoundingClientRect();
  const clone = element.cloneNode(true);
  clone.style.width = `${Math.max(1, rect.width)}px`;
  clone.style.height = `${Math.max(1, rect.height)}px`;
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-10000px";
  wrapper.style.top = "0";
  wrapper.style.width = `${Math.max(1, rect.width)}px`;
  wrapper.style.height = `${Math.max(1, rect.height)}px`;
  wrapper.style.background = COLORS.fondo;
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  normalizeOklchColors(wrapper);
  return { wrapper, node: clone };
};

const copyElementToClipboard = async (element, fileName = "grafica") => {
  if (!element) return "error";
  let wrapper = null;
  try {
    const capture = createCaptureNode(element);
    wrapper = capture.wrapper;
    const node = capture.node;
    const dataUrl = await toPng(node, {
      cacheBust: true,
      backgroundColor: COLORS.fondo,
      filter: (node) => node?.dataset?.captureIgnore !== "true",
    });
    const blob = await (await fetch(dataUrl)).blob();
    if (!blob) throw new Error("No se pudo generar la imagen");
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new window.ClipboardItem({ "image/png": blob })]);
      return "copied";
    }
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return "downloaded";
  } catch (error) {
    console.warn("No se pudo copiar la grafica", error);
    return "error";
  } finally {
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
};

const CopyButton = ({ targetRef, label }) => {
  const [status, setStatus] = useState("idle");

  const handleClick = async () => {
    setStatus("idle");
    const result = await copyElementToClipboard(targetRef?.current, label);
    if (result === "copied") {
      setStatus("copied");
    } else if (result === "downloaded") {
      setStatus("downloaded");
    } else {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 1600);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-capture-ignore="true"
      className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded-lg border border-gray-700/60 bg-gray-900/70 text-gray-300 hover:text-white hover:border-gray-600 transition-colors flex items-center gap-1"
      title="Copiar grafica"
    >
      <Copy className="w-3.5 h-3.5" />
      {status === "copied" ? "Copiado" : status === "downloaded" ? "Descargado" : status === "error" ? "Error" : "Copiar"}
    </button>
  );
};

export default function App() {
  const [dataState, setDataState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [repoManifest, setRepoManifest] = useState({});
  const [repoMonths, setRepoMonths] = useState([]);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [repoError, setRepoError] = useState("");
  const [blacklistSet, setBlacklistSet] = useState(new Set());
  const [onlyBlacklist, setOnlyBlacklist] = useState(false);
  const scatterRef = useRef(null);
  const barRef = useRef(null);
  const pieRef = useRef(null);
  const tableRef = useRef(null);

  const loadManifest = async () => {
      setLoadingRepo(true);
    setRepoError("");
      try {
        const baseUrl = getBaseUrl();
      const manifestUrl = `${baseUrl}excels/manifest.json`;
      const res = await fetch(manifestUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar manifest.json");
        const manifest = await res.json();
        const safeManifest = manifest && typeof manifest === "object" ? manifest : {};
        setRepoManifest(safeManifest);
        const months = Object.keys(safeManifest).sort();
        setRepoMonths([ALL_MONTHS_KEY, ...months]);
        if (months.length > 0) {
          const latest = months[months.length - 1];
          setSelectedMonth(latest);
          await loadMonthFromRepo(latest, safeManifest);
        }
      } catch (error) {
        console.warn("No se pudo cargar el manifest del repo", error);
      setRepoError("No se pudo cargar el manifest del repo.");
      } finally {
        setLoadingRepo(false);
      }
    };

  useEffect(() => {
    loadManifest();
  }, []);

  useEffect(() => {
    const loadBlacklist = async () => {
      try {
        const baseUrl = getBaseUrl();
        const res = await fetch(`${baseUrl}lista-negra.json`, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar lista-negra.json");
        const json = await res.json();
        const refs = extractBlacklistRefs(json)
          .map(normalizeRef)
          .filter(Boolean);
        setBlacklistSet(new Set(refs));
      } catch (error) {
        console.warn("No se pudo cargar la lista negra", error);
        setBlacklistSet(new Set());
      }
    };
    loadBlacklist();
  }, []);

  const { data: rawData } = dataState || { data: [] };

  const dataWithBlacklist = useMemo(() => {
    if (!rawData.length) return [];
    if (!blacklistSet || blacklistSet.size === 0) return rawData;
    return rawData.map((d) => ({
      ...d,
      blacklisted: blacklistSet.has(normalizeRef(d.articulo)),
    }));
  }, [rawData, blacklistSet]);


  const allFamilies = useMemo(() => {
    return [...new Set(dataWithBlacklist.map(d => d.familia))].filter(Boolean).sort();
  }, [dataWithBlacklist]);

  const filteredData = useMemo(() => {
    let result = dataWithBlacklist;
    if (selectedFamilies.length > 0) {
      result = result.filter(d => selectedFamilies.includes(d.familia));
    }
    if (onlyBlacklist) {
      result = result.filter(d => d.blacklisted);
    }
    return result;
  }, [dataWithBlacklist, selectedFamilies, onlyBlacklist]);

  const totals = useMemo(() => {
    return {
      totalRechazo: filteredData.reduce((acc, curr) => acc + curr.valor_rechazo, 0),
      totalCascos: filteredData.reduce((acc, curr) => acc + curr.cascos, 0),
      totalUdsRechazo: filteredData.reduce((acc, curr) => acc + curr.rechazo_uds, 0),
    };
  }, [filteredData]);

  const { totalRechazo, totalCascos, totalUdsRechazo } = totals;

  const resumenTramo = useMemo(() => {
    if (!dataState) return [];
    const tramos = ["1-5 cascos", "6-10 cascos", "11-20 cascos", "21-50 cascos", ">50 cascos"];
    return tramos.map(t => {
      const sub = filteredData.filter(d => d.tramo === t);
      return {
        tramo: t,
        refs_total: sub.length,
        tasa_media: sub.length ? (sub.reduce((acc, curr) => acc + curr.tasa_pct, 0) / sub.length).toFixed(1) : 0,
        valor_rechazo: sub.reduce((acc, curr) => acc + curr.valor_rechazo, 0),
        total_cascos: sub.reduce((acc, curr) => acc + curr.cascos, 0),
        refs_con_rechazo: sub.filter(d => d.valor_rechazo > 0).length
      };
    });
  }, [dataState, filteredData]);

  const criticas = useMemo(() => filteredData.filter(d => d.riesgo.includes("Crítico")).length, [filteredData]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const result = await processExcelData(file);
      setDataState(result);
      setSelectedFamilies([]);
    } catch (error) {
      console.error("Error processing file", error);
      alert("Error al procesar el archivo Excel. Asegúrate de que el formato sea correcto.");
    } finally {
      setLoading(false);
    }
  };

  const loadMonthFromRepo = async (monthKey, manifest = repoManifest) => {
    if (monthKey === ALL_MONTHS_KEY) {
      await loadAllMonthsFromRepo(manifest);
      return;
    }
    const filePath = manifest[monthKey];
    if (!filePath) {
      setDataState(null);
      return;
    }
    setLoading(true);
    try {
      const baseUrl = getBaseUrl();
      const normalized = new URL(filePath, baseUrl).toString();
      const res = await fetch(normalized, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar el Excel del repo");
      const buffer = await res.arrayBuffer();
      const result = processExcelArrayBuffer(buffer);
      setDataState(result);
      setSelectedFamilies([]);
    } catch (error) {
      console.error("Error loading repo Excel", error);
      alert("No se pudo cargar el Excel desde el repo. Revisa el manifest y la ruta.");
      setDataState(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAllMonthsFromRepo = async (manifest = repoManifest) => {
    const months = Object.keys(manifest).sort();
    if (months.length === 0) {
      setDataState(null);
      return;
    }
    setLoading(true);
    try {
      const baseUrl = getBaseUrl();
      const results = await Promise.all(
        months.map(async (m) => {
          const filePath = manifest[m];
          if (!filePath) return null;
          const normalized = new URL(filePath, baseUrl).toString();
          const res = await fetch(normalized, { cache: "no-store" });
          if (!res.ok) throw new Error(`No se pudo cargar el Excel del repo: ${m}`);
          const buffer = await res.arrayBuffer();
          return processExcelArrayBuffer(buffer);
        })
      );
      const validResults = results.filter(Boolean);
      const combinedData = validResults.flatMap(r => r.data);
      const aggregatedData = aggregateByReferencia(combinedData);
      const totals = validResults.reduce(
        (acc, curr) => ({
          totalRechazo: acc.totalRechazo + curr.totalRechazo,
          totalCascos: acc.totalCascos + curr.totalCascos,
          totalUdsRechazo: acc.totalUdsRechazo + curr.totalUdsRechazo,
        }),
        { totalRechazo: 0, totalCascos: 0, totalUdsRechazo: 0 }
      );
      setDataState({
        data: aggregatedData,
        avgRate,
        ...totals,
      });
      setSelectedFamilies([]);
    } catch (error) {
      console.error("Error loading repo Excel (all months)", error);
      alert("No se pudieron cargar los Excels del repo. Revisa el manifest y las rutas.");
      setDataState(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (value) => {
    const monthKey = value || getCurrentMonth();
    setSelectedMonth(monthKey);
    if (monthKey === ALL_MONTHS_KEY) {
      loadMonthFromRepo(monthKey);
      return;
    }
    if (repoManifest[monthKey]) {
      loadMonthFromRepo(monthKey);
    } else {
      setDataState(null);
    }
  };

  if (!dataState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-12 max-w-lg w-full text-center">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10">
            <Upload className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Carga de Datos</h1>
          <p className="text-gray-400 mb-8">
            Sube tu archivo Excel de producción para generar el dashboard interactivo de Lizarte.
          </p>

          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mes (repo)</label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-200"
              disabled={loadingRepo || repoMonths.length === 0}
            >
              {repoMonths.length === 0 && <option value={selectedMonth}>Sin meses en manifest</option>}
              {repoMonths.map(m => (
                <option key={m} value={m}>{m === ALL_MONTHS_KEY ? ALL_MONTHS_LABEL : m}</option>
              ))}
            </select>
            <div className="text-[11px] text-gray-500 mt-2">
              {loadingRepo ? "Cargando manifest..." : "Carga desde /excels/manifest.json"}
            </div>
            {repoError && (
              <div className="text-[11px] text-red-400 mt-1">{repoError}</div>
            )}
            <button
              type="button"
              onClick={loadManifest}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300"
            >
              Recargar manifest
            </button>
          </div>

          <label className="btn-primary block w-full py-4 text-center text-lg cursor-pointer">
            {loading ? "Procesando..." : "Seleccionar Excel"}
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading} />
          </label>

          <div className="mt-8 flex items-center justify-center gap-6 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Cálculo de tramos
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Segmentación IA
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-7 bg-blue-500 rounded-full" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Producción vs Rechazo por Referencia
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-4">LIZARTE Dashboard · Análisis basado en carga de datos real</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="bg-gray-900/50 border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-gray-200"
            disabled={loadingRepo || repoMonths.length === 0}
          >
            {repoMonths.length === 0 && <option value={selectedMonth}>Sin meses</option>}
            {repoMonths.map(m => (
              <option key={m} value={m}>{m === ALL_MONTHS_KEY ? ALL_MONTHS_LABEL : m}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setDataState(null);
              setSelectedFamilies([]);
            }}
            className="bg-gray-800/50 hover:bg-gray-800 text-gray-300 px-4 py-2 rounded-lg border border-gray-700/50 text-sm transition-all"
          >
            Cambiar Archivo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-8 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Filtrar por Familia:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allFamilies.map(fam => (
            <button
              key={fam}
              onClick={() => {
                setSelectedFamilies(prev =>
                  prev.includes(fam)
                    ? prev.filter(f => f !== fam)
                    : [...prev, fam]
                );
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${selectedFamilies.includes(fam)
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                  : "bg-gray-800/50 text-gray-500 border-gray-700/50 hover:border-gray-600"
                }`}
            >
              {fam}
            </button>
          ))}
          {selectedFamilies.length > 0 && (
            <button
              onClick={() => setSelectedFamilies([])}
              className="px-3 py-1 rounded-full text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lista negra:</label>
          <button
            type="button"
            onClick={() => setOnlyBlacklist(prev => !prev)}
            disabled={blacklistSet.size === 0}
            className={`text-[11px] px-3 py-2 rounded-lg border transition-colors ${onlyBlacklist
              ? "border-red-500/60 text-red-300 bg-red-500/10"
              : "border-gray-700/50 text-gray-400 bg-gray-900/40"} ${blacklistSet.size === 0 ? "opacity-50 cursor-not-allowed" : "hover:text-white"}`}
          >
            Solo lista negra
          </button>
          <div className="text-[11px] text-gray-500">
            {blacklistSet.size > 0 ? `${blacklistSet.size} refs marcadas` : "Sin lista cargada"}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Refs activas", value: filteredData.length, sub: "con producción > 0", color: COLORS.azul, icon: FileText },
          { label: "Valor rechazo", value: `${totalRechazo.toLocaleString('es-ES')}€`, sub: `${filteredData.filter(d => d.valor_rechazo > 0).length} refs con rechazo`, color: COLORS.naranja, icon: TrendingUp },
          { label: "Tasa global", value: `${(totalUdsRechazo / totalCascos * 100).toFixed(2)}%`, sub: `${totalUdsRechazo.toLocaleString('es-ES')} uds rechazadas`, color: COLORS.rojo, icon: AlertTriangle },
          { label: "Refs críticas", value: criticas, sub: "≤5 cascos, >50% rechazo", color: COLORS.critico, icon: AlertTriangle },
        ].map((k, i) => (
          <div key={i} className="glass-card p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{k.label}</span>
              <k.icon className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: k.color }} />
            </div>
            <div className="text-3xl font-bold tabular-nums mb-1" style={{ color: k.color }}>{k.value}</div>
            <div className="text-sm text-gray-500">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-800/50">
        {["Dispersión", "Análisis por Tramo", "Tabla Detallada"].map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`tab-btn pb-4 px-2 ${tab === i ? "active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-card p-8 relative">
        {tab === 0 && (
          <div className="h-[500px] w-full relative" ref={scatterRef}>
            <CopyButton targetRef={scatterRef} label="scatter" />
            <div className="flex gap-6 mb-6">
              {Object.entries(SEGMENTOS).map(([name, seg]) => (
                <div key={name} className="flex items-center gap-2 text-xs font-medium" style={{ color: seg.color }}>
                  <span>{seg.emoji}</span>
                  {name}
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs font-medium text-red-300">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-red-400" />
                Lista negra
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2E45" vertical={false} />
                <XAxis
                  type="number"
                  dataKey="cascos"
                  name="Cascos"
                  tick={{ fill: "#6A8099", fontSize: 11 }}
                  axisLine={{ stroke: "#1A2E45" }}
                  label={{ value: "Cascos producidos", position: "bottom", fill: "#6A8099", fontSize: 12, dy: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="tasa_pct"
                  name="Tasa"
                  domain={[0, 'auto']}
                  tick={{ fill: "#6A8099", fontSize: 11 }}
                  axisLine={{ stroke: "#1A2E45" }}
                  label={{ value: "Tasa rechazo %", angle: -90, position: "left", fill: "#6A8099", fontSize: 12, dx: 0 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={23.35} stroke={COLORS.azul} strokeDasharray="5 5" label={{ value: "Media global", fill: COLORS.azul, fontSize: 10, position: "insideBottomRight" }} />
                <ReferenceLine x={20} stroke={COLORS.naranja} strokeDasharray="5 5" label={{ value: "Baja prod", fill: COLORS.naranja, fontSize: 10, position: "insideTopLeft" }} />
                {Object.keys(SEGMENTOS).map(segName => (
                  <Scatter
                    key={segName}
                    name={segName}
                    data={filteredData.filter(d => d.riesgo === segName)}
                    fill={SEGMENTOS[segName].color}
                    shape={(props) => {
                      const { cx, cy, payload } = props;
                      const valor = Number(payload?.valor_rechazo) || 0;
                      const r = Math.max(4, Math.min(24, Math.sqrt(valor) * 0.4));
                      const fill = SEGMENTOS[segName].color;
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.6} stroke={fill} strokeWidth={1} />
                          {payload.blacklisted && (
                            <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={COLORS.critico} strokeWidth={2} />
                          )}
                        </g>
                      );
                    }}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {tab === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="relative" ref={barRef}>
              <CopyButton targetRef={barRef} label="tasa-media-tramo" />
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-8">Tasa Media por Tramo</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resumenTramo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A2E45" vertical={false} />
                    <XAxis dataKey="tramo" tick={{ fill: "#6A8099", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6A8099", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: "#111E2E", borderRadius: "8px", border: "1px solid #1A2E45" }} />
                    <Bar dataKey="tasa_media" radius={[4, 4, 0, 0]}>
                      {resumenTramo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TRAMO_COLORS[entry.tramo]} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="relative" ref={pieRef}>
              <CopyButton targetRef={pieRef} label="valor-rechazo-tramo" />
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-8">Valor Rechazo por Tramo</h3>
              <div className="flex items-center">
                {(() => {
                  const pieData = resumenTramo.filter(t => t.valor_rechazo > 0);
                  return (
                    <>
                <div className="h-[300px] w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="valor_rechazo"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={TRAMO_COLORS[entry.tramo]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#111E2E", borderRadius: "8px", border: "1px solid #1A2E45" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-4">
                  {pieData.slice().reverse().map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: TRAMO_COLORS[t.tramo] }} />
                        <span className="text-gray-400">{t.tramo}</span>
                      </div>
                      <span className="font-mono text-gray-200">{t.valor_rechazo.toLocaleString('es-ES')}€</span>
                    </div>
                  ))}
                </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div className="overflow-x-auto relative" ref={tableRef}>
            <CopyButton targetRef={tableRef} label="tabla-detallada" />
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800/50">
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Referencia</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Familia</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Tramo</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Cascos</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Tasa Rechazo</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Rechazo</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredData.sort((a, b) => b.valor_rechazo - a.valor_rechazo).slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/30 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span>{row.articulo}</span>
                        {row.blacklisted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/60 text-red-300 bg-red-500/10">
                            LISTA NEGRA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-xs">{row.familia}</td>
                    <td className="py-4 px-4">
                      <span
                        className="px-2 py-1 rounded-md text-[10px] font-bold"
                        style={{ background: `${TRAMO_COLORS[row.tramo]}20`, color: TRAMO_COLORS[row.tramo], border: `1px solid ${TRAMO_COLORS[row.tramo]}40` }}
                      >
                        {row.tramo}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400">{row.cascos}</td>
                    <td className="py-4 px-4 font-bold" style={{ color: row.tasa_pct > 50 ? COLORS.critico : row.tasa_pct > 25 ? COLORS.naranja : COLORS.texto }}>
                      {row.tasa_pct.toFixed(1)}%
                    </td>
                    <td className="py-4 px-4 font-mono font-bold" style={{ color: COLORS.naranja }}>
                      {row.valor_rechazo.toLocaleString('es-ES')}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

