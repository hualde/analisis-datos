import { useState, useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, Legend, PieChart, Pie } from "recharts";

const C = {
  fondo: "#0D1520", card: "#111E2E", borde: "#1A2E45",
  texto: "#C8D8E8", blanco: "#EEF4FA", gris: "#6A8099",
  rojo: "#E03A3A", naranja: "#F07830", amarillo: "#E8C020",
  verde: "#28B86A", azul: "#3080F0", morado: "#9060E0",
  critico: "#FF2040",
};

const SEGMENTOS = {
  "Crítico (≤5 cascos, >50%)": { color: C.critico, emoji: "🔴" },
  "Baja prod, alto rechazo":   { color: C.naranja,  emoji: "🟠" },
  "Alta prod, alto rechazo":   { color: C.amarillo, emoji: "🟡" },
  "Bajo rechazo":              { color: C.verde,    emoji: "🟢" },
};

const resumenTramo = [
  { tramo: "1-5 cascos",   refs_total: 18, refs_con_rechazo: 7,  pct_con_rechazo: 38.9, tasa_media: 71.4, refs_gt50: 4,  total_cascos: 34,   valor_rechazo: 864   },
  { tramo: "6-10 cascos",  refs_total: 20, refs_con_rechazo: 17, pct_con_rechazo: 85.0, tasa_media: 43.8, refs_gt50: 6,  total_cascos: 160,  valor_rechazo: 3556  },
  { tramo: "11-20 cascos", refs_total: 12, refs_con_rechazo: 10, pct_con_rechazo: 83.3, tasa_media: 35.4, refs_gt50: 2,  total_cascos: 183,  valor_rechazo: 3092  },
  { tramo: "21-50 cascos", refs_total: 11, refs_con_rechazo: 10, pct_con_rechazo: 90.9, tasa_media: 24.9, refs_gt50: 0,  total_cascos: 331,  valor_rechazo: 5187  },
  { tramo: ">50 cascos",   refs_total: 15, refs_con_rechazo: 15, pct_con_rechazo: 100,  tasa_media: 21.6, refs_gt50: 0,  total_cascos: 1166, valor_rechazo: 20629 },
];

const TRAMO_COLORS = {
  "1-5 cascos":   "#FF3B3B",
  "6-10 cascos":  "#F0833A",
  "11-20 cascos": "#F5C842",
  "21-50 cascos": "#3DD68C",
  ">50 cascos":   "#3080F0",
}; 

const criticasData = [
  { art: "04551212",  cascos: 4, uds: 3, tasa: 75,  obj: 25,  valor: 183.0,  ventas: 11247, mc: 19.8, impacto: 1.6,  mc_perdido: 36  },
  { art: "06965600",  cascos: 1, uds: 1, tasa: 100, obj: 16,  valor: 103.5,  ventas: 498,   mc: 41.5, impacto: 20.8, mc_perdido: 43  },
  { art: "08351500",  cascos: 4, uds: 3, tasa: 100, obj: 16,  valor: 211.5,  ventas: 6403,  mc: 30.9, impacto: 3.3,  mc_perdido: 65  },
  { art: "08441060",  cascos: 1, uds: 1, tasa: 100, obj: 16,  valor: 70.0,   ventas: 238,   mc: 48.8, impacto: 29.5, mc_perdido: 34  },
];

const topImpactoData = [
  { art: "04552501",   cascos: 7,  tasa: 100,  valor: 366,  ventas_k: 0.45,  mc: 30.2, impacto: 81.9, mc_perdido: 111, riesgo: "Baja prod, alto rechazo" },
  { art: "06562550",   cascos: 27, tasa: 29.6, valor: 808,  ventas_k: 1.59,  mc: 16.6, impacto: 50.7, mc_perdido: 134, riesgo: "Alta prod, alto rechazo" },
  { art: "08441060",   cascos: 1,  tasa: 100,  valor: 70,   ventas_k: 0.24,  mc: 48.8, impacto: 29.5, mc_perdido: 34,  riesgo: "Crítico (≤5 cascos, >50%)" },
  { art: "06965600",   cascos: 1,  tasa: 100,  valor: 104,  ventas_k: 0.50,  mc: 41.5, impacto: 20.8, mc_perdido: 43,  riesgo: "Crítico (≤5 cascos, >50%)" },
  { art: "08263503",   cascos: 2,  tasa: 50,   valor: 70,   ventas_k: 0.46,  mc: 32.7, impacto: 15.1, mc_perdido: 23,  riesgo: "Baja prod, alto rechazo" },
  { art: "04550960",   cascos: 12, tasa: 41.7, valor: 305,  ventas_k: 3.30,  mc: 44.3, impacto: 9.25, mc_perdido: 135, riesgo: "Baja prod, alto rechazo" },
  { art: "06282506",   cascos: 2,  tasa: 50,   valor: 161,  ventas_k: 1.83,  mc: 51.0, impacto: 8.79, mc_perdido: 82,  riesgo: "Baja prod, alto rechazo" },
  { art: "E06091800",  cascos: 67, tasa: 38.8, valor: 1326, ventas_k: 20.3,  mc: 53.7, impacto: 6.52, mc_perdido: 712, riesgo: "Alta prod, alto rechazo" },
  { art: "04551525",   cascos: 6,  tasa: 66.7, valor: 244,  ventas_k: 3.95,  mc: 8.4,  impacto: 6.18, mc_perdido: 20,  riesgo: "Baja prod, alto rechazo" },
  { art: "04550937",   cascos: 7,  tasa: 57.1, valor: 244,  ventas_k: 4.09,  mc: 24.9, impacto: 5.97, mc_perdido: 61,  riesgo: "Baja prod, alto rechazo" },
  { art: "08700900",   cascos: 13, tasa: 53.8, valor: 490,  ventas_k: 8.25,  mc: 50.0, impacto: 5.94, mc_perdido: 245, riesgo: "Baja prod, alto rechazo" },
  { art: "04551000",   cascos: 9,  tasa: 66.7, valor: 291,  ventas_k: 7.25,  mc: -1.8, impacto: 4.01, mc_perdido: -5,  riesgo: "Baja prod, alto rechazo" },
  { art: "06873000",   cascos: 26, tasa: 19.2, valor: 385,  ventas_k: 10.1,  mc: 25.9, impacto: 3.82, mc_perdido: 100, riesgo: "Bajo rechazo" },
];

const topMCData = [
  { art: "06282502",  cascos: 122, tasa: 28.9, valor: 5140, ventas_k: 147.1, mc: 39.5, impacto: 3.49, mc_perdido: 2029, riesgo: "Alta prod, alto rechazo" },
  { art: "E06091800", cascos: 67,  tasa: 38.8, valor: 1326, ventas_k: 20.3,  mc: 53.7, impacto: 6.52, mc_perdido: 712,  riesgo: "Alta prod, alto rechazo" },
  { art: "06641500",  cascos: 73,  tasa: 15.1, valor: 958,  ventas_k: 31.7,  mc: 60.0, impacto: 3.02, mc_perdido: 575,  riesgo: "Bajo rechazo" },
  { art: "06805000",  cascos: 120, tasa: 17.5, valor: 2502, ventas_k: 94.8,  mc: 20.3, impacto: 2.64, mc_perdido: 508,  riesgo: "Bajo rechazo" },
  { art: "E06091105", cascos: 58,  tasa: 31.0, valor: 918,  ventas_k: 40.1,  mc: 54.0, impacto: 2.29, mc_perdido: 495,  riesgo: "Alta prod, alto rechazo" },
  { art: "06964000",  cascos: 103, tasa: 27.2, valor: 1717, ventas_k: 121.2, mc: 25.3, impacto: 1.42, mc_perdido: 434,  riesgo: "Alta prod, alto rechazo" },
  { art: "06964700",  cascos: 52,  tasa: 31.4, valor: 1900, ventas_k: 115.6, mc: 21.2, impacto: 1.64, mc_perdido: 403,  riesgo: "Alta prod, alto rechazo" },
  { art: "08264500",  cascos: 62,  tasa: 17.7, valor: 779,  ventas_k: 64.8,  mc: 41.0, impacto: 1.20, mc_perdido: 320,  riesgo: "Bajo rechazo" },
  { art: "06282500",  cascos: 26,  tasa: 23.1, valor: 793,  ventas_k: 44.96, mc: 36.1, impacto: 1.76, mc_perdido: 286,  riesgo: "Alta prod, alto rechazo" },
  { art: "06641600",  cascos: 59,  tasa: 16.9, valor: 812,  ventas_k: 81.7,  mc: 34.0, impacto: 0.99, mc_perdido: 276,  riesgo: "Bajo rechazo" },
  { art: "08700900",  cascos: 13,  tasa: 53.8, valor: 490,  ventas_k: 8.25,  mc: 50.0, impacto: 5.94, mc_perdido: 245,  riesgo: "Baja prod, alto rechazo" },
  { art: "06561000",  cascos: 85,  tasa: 17.6, valor: 1349, ventas_k: 104.9, mc: 18.0, impacto: 1.29, mc_perdido: 242,  riesgo: "Bajo rechazo" },
  { art: "06641250",  cascos: 129, tasa: 7.8,  valor: 792,  ventas_k: 223.8, mc: 29.7, impacto: 0.35, mc_perdido: 235,  riesgo: "Bajo rechazo" },
  { art: "04550500",  cascos: 73,  tasa: 16.4, valor: 725,  ventas_k: 128.1, mc: 31.9, impacto: 0.57, mc_perdido: 231,  riesgo: "Bajo rechazo" },
  { art: "08621200",  cascos: 21,  tasa: 42.9, valor: 594,  ventas_k: 39.62, mc: 36.7, impacto: 1.50, mc_perdido: 218,  riesgo: "Alta prod, alto rechazo" },
];

// Scatter data — 59 refs Lizarte ON con producción y rechazo
const rawScatter = [{"Articulo":"06282502","Cascos":122,"tasa_pct":28.9,"Valor_Rechazo":5140,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06805000","Cascos":120,"tasa_pct":17.5,"Valor_Rechazo":2502,"riesgo":"Bajo rechazo"},{"Articulo":"06964700","Cascos":52,"tasa_pct":31.4,"Valor_Rechazo":1900,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06964000","Cascos":103,"tasa_pct":27.2,"Valor_Rechazo":1717,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06561000","Cascos":85,"tasa_pct":17.6,"Valor_Rechazo":1349,"riesgo":"Bajo rechazo"},{"Articulo":"E06091800","Cascos":67,"tasa_pct":38.8,"Valor_Rechazo":1326,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06641500","Cascos":73,"tasa_pct":15.1,"Valor_Rechazo":958,"riesgo":"Bajo rechazo"},{"Articulo":"04550802","Cascos":53,"tasa_pct":26.4,"Valor_Rechazo":955,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"E06091105","Cascos":58,"tasa_pct":31.0,"Valor_Rechazo":918,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06641600","Cascos":59,"tasa_pct":16.9,"Valor_Rechazo":812,"riesgo":"Bajo rechazo"},{"Articulo":"06562550","Cascos":27,"tasa_pct":29.6,"Valor_Rechazo":808,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06282500","Cascos":26,"tasa_pct":23.1,"Valor_Rechazo":793,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06641250","Cascos":129,"tasa_pct":7.8,"Valor_Rechazo":792,"riesgo":"Bajo rechazo"},{"Articulo":"08264500","Cascos":62,"tasa_pct":17.7,"Valor_Rechazo":779,"riesgo":"Bajo rechazo"},{"Articulo":"04550500","Cascos":73,"tasa_pct":16.4,"Valor_Rechazo":725,"riesgo":"Bajo rechazo"},{"Articulo":"04551400","Cascos":48,"tasa_pct":27.1,"Valor_Rechazo":669,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06562500","Cascos":28,"tasa_pct":15.4,"Valor_Rechazo":451,"riesgo":"Bajo rechazo"},{"Articulo":"06161601","Cascos":15,"tasa_pct":40.0,"Valor_Rechazo":456,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06161560","Cascos":52,"tasa_pct":18.0,"Valor_Rechazo":324,"riesgo":"Bajo rechazo"},{"Articulo":"06873000","Cascos":26,"tasa_pct":19.2,"Valor_Rechazo":385,"riesgo":"Bajo rechazo"},{"Articulo":"06873010","Cascos":36,"tasa_pct":13.9,"Valor_Rechazo":353,"riesgo":"Bajo rechazo"},{"Articulo":"04551212","Cascos":4,"tasa_pct":75.0,"Valor_Rechazo":183,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"04551200","Cascos":12,"tasa_pct":58.3,"Valor_Rechazo":408,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551210","Cascos":12,"tasa_pct":41.7,"Valor_Rechazo":306,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550960","Cascos":12,"tasa_pct":41.7,"Valor_Rechazo":305,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550930","Cascos":10,"tasa_pct":40.0,"Valor_Rechazo":279,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551000","Cascos":9,"tasa_pct":66.7,"Valor_Rechazo":291,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551020","Cascos":18,"tasa_pct":27.8,"Valor_Rechazo":305,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04552501","Cascos":7,"tasa_pct":100.0,"Valor_Rechazo":366,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550902","Cascos":15,"tasa_pct":40.0,"Valor_Rechazo":307,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08700900","Cascos":13,"tasa_pct":53.8,"Valor_Rechazo":490,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08621200","Cascos":21,"tasa_pct":42.9,"Valor_Rechazo":594,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06965503","Cascos":31,"tasa_pct":45.5,"Valor_Rechazo":596,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06706006","Cascos":8,"tasa_pct":62.5,"Valor_Rechazo":367,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08966000","Cascos":7,"tasa_pct":71.4,"Valor_Rechazo":350,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08265002","Cascos":17,"tasa_pct":33.3,"Valor_Rechazo":334,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551304","Cascos":8,"tasa_pct":50.0,"Valor_Rechazo":224,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551525","Cascos":6,"tasa_pct":66.7,"Valor_Rechazo":244,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550937","Cascos":7,"tasa_pct":57.1,"Valor_Rechazo":244,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06091000","Cascos":8,"tasa_pct":37.5,"Valor_Rechazo":397,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551700","Cascos":9,"tasa_pct":33.3,"Valor_Rechazo":93,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551702","Cascos":6,"tasa_pct":33.3,"Valor_Rechazo":122,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08351500","Cascos":4,"tasa_pct":100.0,"Valor_Rechazo":212,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"06965600","Cascos":1,"tasa_pct":100.0,"Valor_Rechazo":104,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"08441060","Cascos":1,"tasa_pct":100.0,"Valor_Rechazo":70,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"04550916","Cascos":4,"tasa_pct":25.0,"Valor_Rechazo":65,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550201","Cascos":10,"tasa_pct":30.0,"Valor_Rechazo":145,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551211","Cascos":6,"tasa_pct":16.7,"Valor_Rechazo":66,"riesgo":"Bajo rechazo"},{"Articulo":"06282506","Cascos":2,"tasa_pct":50.0,"Valor_Rechazo":161,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08263503","Cascos":2,"tasa_pct":50.0,"Valor_Rechazo":70,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06873004","Cascos":8,"tasa_pct":12.5,"Valor_Rechazo":67,"riesgo":"Bajo rechazo"},{"Articulo":"08265350","Cascos":7,"tasa_pct":28.6,"Valor_Rechazo":92,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08621276","Cascos":7,"tasa_pct":28.6,"Valor_Rechazo":140,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"E06091805","Cascos":24,"tasa_pct":12.5,"Valor_Rechazo":153,"riesgo":"Bajo rechazo"},{"Articulo":"04550910","Cascos":35,"tasa_pct":20.0,"Valor_Rechazo":387,"riesgo":"Bajo rechazo"},{"Articulo":"08621301","Cascos":10,"tasa_pct":10.0,"Valor_Rechazo":69,"riesgo":"Bajo rechazo"},{"Articulo":"08700500","Cascos":16,"tasa_pct":6.2,"Valor_Rechazo":70,"riesgo":"Bajo rechazo"},{"Articulo":"08701000","Cascos":18,"tasa_pct":11.1,"Valor_Rechazo":113,"riesgo":"Bajo rechazo"},{"Articulo":"04551400","Cascos":48,"tasa_pct":27.1,"Valor_Rechazo":669,"riesgo":"Alta prod, alto rechazo"}]; [{"Articulo":"06282502","Cascos":122,"tasa_pct":28.9,"Valor_Rechazo":5140,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01283215","Cascos":80,"tasa_pct":31.2,"Valor_Rechazo":3120,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06805000","Cascos":120,"tasa_pct":17.5,"Valor_Rechazo":2502,"riesgo":"Bajo rechazo"},{"Articulo":"06964700","Cascos":52,"tasa_pct":31.4,"Valor_Rechazo":1900,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"04940385","Cascos":177,"tasa_pct":53.7,"Valor_Rechazo":1758,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06964000","Cascos":103,"tasa_pct":27.2,"Valor_Rechazo":1717,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01053400","Cascos":24,"tasa_pct":58.3,"Valor_Rechazo":1711,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01283222","Cascos":77,"tasa_pct":34.2,"Valor_Rechazo":1687,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01092220","Cascos":52,"tasa_pct":34,"Valor_Rechazo":1547,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01587000","Cascos":41,"tasa_pct":55,"Valor_Rechazo":1480,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01561640","Cascos":31,"tasa_pct":38.7,"Valor_Rechazo":1387,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06561000","Cascos":85,"tasa_pct":17.6,"Valor_Rechazo":1349,"riesgo":"Bajo rechazo"},{"Articulo":"01934000","Cascos":30,"tasa_pct":66.7,"Valor_Rechazo":1345,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"E06091800","Cascos":67,"tasa_pct":38.8,"Valor_Rechazo":1326,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01963500","Cascos":27,"tasa_pct":40,"Valor_Rechazo":1211,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01092650","Cascos":15,"tasa_pct":73.3,"Valor_Rechazo":1156,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01161584","Cascos":60,"tasa_pct":25,"Valor_Rechazo":994,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06641500","Cascos":73,"tasa_pct":15.1,"Valor_Rechazo":958,"riesgo":"Bajo rechazo"},{"Articulo":"04550802","Cascos":53,"tasa_pct":26.4,"Valor_Rechazo":955,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"E06091105","Cascos":58,"tasa_pct":31,"Valor_Rechazo":918,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01053005","Cascos":27,"tasa_pct":55.6,"Valor_Rechazo":885,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06641600","Cascos":59,"tasa_pct":16.9,"Valor_Rechazo":812,"riesgo":"Bajo rechazo"},{"Articulo":"06562550","Cascos":27,"tasa_pct":29.6,"Valor_Rechazo":808,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01707500","Cascos":20,"tasa_pct":30,"Valor_Rechazo":794,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06282500","Cascos":26,"tasa_pct":23.1,"Valor_Rechazo":793,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06641250","Cascos":129,"tasa_pct":7.8,"Valor_Rechazo":792,"riesgo":"Bajo rechazo"},{"Articulo":"08264500","Cascos":62,"tasa_pct":17.7,"Valor_Rechazo":779,"riesgo":"Bajo rechazo"},{"Articulo":"01162200","Cascos":66,"tasa_pct":18.5,"Valor_Rechazo":747,"riesgo":"Bajo rechazo"},{"Articulo":"04550500","Cascos":73,"tasa_pct":16.4,"Valor_Rechazo":725,"riesgo":"Bajo rechazo"},{"Articulo":"01053300","Cascos":18,"tasa_pct":38.9,"Valor_Rechazo":683,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01562000","Cascos":9,"tasa_pct":66.7,"Valor_Rechazo":674,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551400","Cascos":48,"tasa_pct":27.1,"Valor_Rechazo":669,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01432000","Cascos":14,"tasa_pct":57.1,"Valor_Rechazo":619,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06965503","Cascos":31,"tasa_pct":45.5,"Valor_Rechazo":596,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"08621200","Cascos":21,"tasa_pct":42.9,"Valor_Rechazo":594,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01586600","Cascos":10,"tasa_pct":100,"Valor_Rechazo":549,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01396660","Cascos":22,"tasa_pct":36.4,"Valor_Rechazo":541,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01161655","Cascos":13,"tasa_pct":80,"Valor_Rechazo":522,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01162593","Cascos":166,"tasa_pct":6,"Valor_Rechazo":516,"riesgo":"Bajo rechazo"},{"Articulo":"R5WS40086","Cascos":23,"tasa_pct":47.8,"Valor_Rechazo":506,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01261950","Cascos":40,"tasa_pct":20,"Valor_Rechazo":500,"riesgo":"Bajo rechazo"},{"Articulo":"08700900","Cascos":13,"tasa_pct":53.8,"Valor_Rechazo":490,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01262019","Cascos":15,"tasa_pct":33.3,"Valor_Rechazo":483,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06161601","Cascos":15,"tasa_pct":40,"Valor_Rechazo":456,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06562500","Cascos":28,"tasa_pct":15.4,"Valor_Rechazo":451,"riesgo":"Bajo rechazo"},{"Articulo":"06932800","Cascos":35,"tasa_pct":40,"Valor_Rechazo":434,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06641000","Cascos":58,"tasa_pct":13.7,"Valor_Rechazo":433,"riesgo":"Bajo rechazo"},{"Articulo":"01284010","Cascos":24,"tasa_pct":21.7,"Valor_Rechazo":412,"riesgo":"Bajo rechazo"},{"Articulo":"01092162","Cascos":32,"tasa_pct":25.8,"Valor_Rechazo":408,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01707000","Cascos":80,"tasa_pct":10.1,"Valor_Rechazo":408,"riesgo":"Bajo rechazo"},{"Articulo":"04551200","Cascos":12,"tasa_pct":58.3,"Valor_Rechazo":408,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01601100","Cascos":23,"tasa_pct":34.8,"Valor_Rechazo":399,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06091000","Cascos":8,"tasa_pct":37.5,"Valor_Rechazo":397,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550910","Cascos":35,"tasa_pct":20,"Valor_Rechazo":387,"riesgo":"Bajo rechazo"},{"Articulo":"06873000","Cascos":26,"tasa_pct":19.2,"Valor_Rechazo":385,"riesgo":"Bajo rechazo"},{"Articulo":"01092270","Cascos":23,"tasa_pct":21.7,"Valor_Rechazo":375,"riesgo":"Bajo rechazo"},{"Articulo":"01261905","Cascos":24,"tasa_pct":33.3,"Valor_Rechazo":372,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"06706006","Cascos":8,"tasa_pct":62.5,"Valor_Rechazo":367,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04552501","Cascos":7,"tasa_pct":100,"Valor_Rechazo":366,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06873010","Cascos":36,"tasa_pct":13.9,"Valor_Rechazo":353,"riesgo":"Bajo rechazo"},{"Articulo":"08966000","Cascos":7,"tasa_pct":71.4,"Valor_Rechazo":350,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01162610","Cascos":67,"tasa_pct":10.4,"Valor_Rechazo":335,"riesgo":"Bajo rechazo"},{"Articulo":"08265002","Cascos":17,"tasa_pct":33.3,"Valor_Rechazo":334,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06161560","Cascos":52,"tasa_pct":18,"Valor_Rechazo":324,"riesgo":"Bajo rechazo"},{"Articulo":"01162010","Cascos":33,"tasa_pct":18.2,"Valor_Rechazo":318,"riesgo":"Bajo rechazo"},{"Articulo":"01162700","Cascos":45,"tasa_pct":11.1,"Valor_Rechazo":313,"riesgo":"Bajo rechazo"},{"Articulo":"04550902","Cascos":15,"tasa_pct":40,"Valor_Rechazo":307,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551210","Cascos":12,"tasa_pct":41.7,"Valor_Rechazo":306,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550960","Cascos":12,"tasa_pct":41.7,"Valor_Rechazo":305,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551020","Cascos":18,"tasa_pct":27.8,"Valor_Rechazo":305,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"R9044A130A","Cascos":8,"tasa_pct":87.5,"Valor_Rechazo":301,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01283501","Cascos":37,"tasa_pct":16.2,"Valor_Rechazo":301,"riesgo":"Bajo rechazo"},{"Articulo":"R5WS40000","Cascos":30,"tasa_pct":23.3,"Valor_Rechazo":295,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"04551000","Cascos":9,"tasa_pct":66.7,"Valor_Rechazo":291,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04130030","Cascos":15,"tasa_pct":73.3,"Valor_Rechazo":286,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550930","Cascos":10,"tasa_pct":40,"Valor_Rechazo":279,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01706360","Cascos":22,"tasa_pct":22.7,"Valor_Rechazo":273,"riesgo":"Bajo rechazo"},{"Articulo":"01053062","Cascos":16,"tasa_pct":26.7,"Valor_Rechazo":264,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01627830","Cascos":29,"tasa_pct":17.2,"Valor_Rechazo":257,"riesgo":"Bajo rechazo"},{"Articulo":"01052005","Cascos":10,"tasa_pct":55.6,"Valor_Rechazo":254,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01801500","Cascos":23,"tasa_pct":34.8,"Valor_Rechazo":248,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"04550937","Cascos":7,"tasa_pct":57.1,"Valor_Rechazo":244,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551525","Cascos":6,"tasa_pct":66.7,"Valor_Rechazo":244,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01052010","Cascos":27,"tasa_pct":14.8,"Valor_Rechazo":238,"riesgo":"Bajo rechazo"},{"Articulo":"01586550","Cascos":10,"tasa_pct":70,"Valor_Rechazo":238,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01642000","Cascos":32,"tasa_pct":12.9,"Valor_Rechazo":238,"riesgo":"Bajo rechazo"},{"Articulo":"01092255","Cascos":3,"tasa_pct":66.7,"Valor_Rechazo":228,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"01561650","Cascos":22,"tasa_pct":9.1,"Valor_Rechazo":225,"riesgo":"Bajo rechazo"},{"Articulo":"04551304","Cascos":8,"tasa_pct":50,"Valor_Rechazo":224,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01641590","Cascos":8,"tasa_pct":50,"Valor_Rechazo":223,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01629000","Cascos":59,"tasa_pct":3.4,"Valor_Rechazo":218,"riesgo":"Bajo rechazo"},{"Articulo":"01932060","Cascos":6,"tasa_pct":50,"Valor_Rechazo":213,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08351500","Cascos":4,"tasa_pct":100,"Valor_Rechazo":212,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"R0986435011","Cascos":9,"tasa_pct":88.9,"Valor_Rechazo":208,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01641410","Cascos":33,"tasa_pct":15.6,"Valor_Rechazo":205,"riesgo":"Bajo rechazo"},{"Articulo":"01641570","Cascos":6,"tasa_pct":100,"Valor_Rechazo":204,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01053054","Cascos":5,"tasa_pct":50,"Valor_Rechazo":199,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01706650","Cascos":8,"tasa_pct":50,"Valor_Rechazo":189,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551212","Cascos":4,"tasa_pct":75,"Valor_Rechazo":183,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"01561551","Cascos":8,"tasa_pct":37.5,"Valor_Rechazo":183,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01432500","Cascos":24,"tasa_pct":17.4,"Valor_Rechazo":174,"riesgo":"Bajo rechazo"},{"Articulo":"04750527","Cascos":21,"tasa_pct":38.1,"Valor_Rechazo":174,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"04880200","Cascos":15,"tasa_pct":73.3,"Valor_Rechazo":172,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01162600","Cascos":16,"tasa_pct":31.2,"Valor_Rechazo":170,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01641560","Cascos":15,"tasa_pct":33.3,"Valor_Rechazo":170,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01161580","Cascos":10,"tasa_pct":50,"Valor_Rechazo":170,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01092160","Cascos":9,"tasa_pct":37.5,"Valor_Rechazo":165,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01627803","Cascos":14,"tasa_pct":30.8,"Valor_Rechazo":164,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06282506","Cascos":2,"tasa_pct":50,"Valor_Rechazo":161,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01987002","Cascos":2,"tasa_pct":100,"Valor_Rechazo":158,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"01053055","Cascos":7,"tasa_pct":42.9,"Valor_Rechazo":157,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06601200","Cascos":15,"tasa_pct":40,"Valor_Rechazo":156,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01707100","Cascos":19,"tasa_pct":15.8,"Valor_Rechazo":153,"riesgo":"Bajo rechazo"},{"Articulo":"01571000","Cascos":8,"tasa_pct":37.5,"Valor_Rechazo":153,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"E06091805","Cascos":24,"tasa_pct":12.5,"Valor_Rechazo":153,"riesgo":"Bajo rechazo"},{"Articulo":"R28232251","Cascos":20,"tasa_pct":40,"Valor_Rechazo":150,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01561520","Cascos":7,"tasa_pct":28.6,"Valor_Rechazo":148,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550201","Cascos":10,"tasa_pct":30,"Valor_Rechazo":145,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08621276","Cascos":7,"tasa_pct":28.6,"Valor_Rechazo":140,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01161660","Cascos":9,"tasa_pct":22.2,"Valor_Rechazo":139,"riesgo":"Bajo rechazo"},{"Articulo":"01162495","Cascos":11,"tasa_pct":44.4,"Valor_Rechazo":136,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01986100","Cascos":10,"tasa_pct":20,"Valor_Rechazo":123,"riesgo":"Bajo rechazo"},{"Articulo":"01963520","Cascos":2,"tasa_pct":50,"Valor_Rechazo":123,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551702","Cascos":6,"tasa_pct":33.3,"Valor_Rechazo":122,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01490020","Cascos":7,"tasa_pct":14.3,"Valor_Rechazo":121,"riesgo":"Bajo rechazo"},{"Articulo":"01706055","Cascos":7,"tasa_pct":28.6,"Valor_Rechazo":121,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01052011","Cascos":10,"tasa_pct":22.2,"Valor_Rechazo":113,"riesgo":"Bajo rechazo"},{"Articulo":"08701000","Cascos":18,"tasa_pct":11.1,"Valor_Rechazo":113,"riesgo":"Bajo rechazo"},{"Articulo":"01162800","Cascos":8,"tasa_pct":28.6,"Valor_Rechazo":112,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"02701100","Cascos":22,"tasa_pct":33.3,"Valor_Rechazo":112,"riesgo":"Alta prod, alto rechazo"},{"Articulo":"01396665","Cascos":17,"tasa_pct":5.9,"Valor_Rechazo":111,"riesgo":"Bajo rechazo"},{"Articulo":"01092230","Cascos":2,"tasa_pct":50,"Valor_Rechazo":104,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06965600","Cascos":1,"tasa_pct":100,"Valor_Rechazo":104,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"06621300","Cascos":18,"tasa_pct":22.2,"Valor_Rechazo":103,"riesgo":"Bajo rechazo"},{"Articulo":"01161583","Cascos":20,"tasa_pct":15,"Valor_Rechazo":102,"riesgo":"Bajo rechazo"},{"Articulo":"06701500","Cascos":20,"tasa_pct":30,"Valor_Rechazo":102,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01627810","Cascos":10,"tasa_pct":20,"Valor_Rechazo":99,"riesgo":"Bajo rechazo"},{"Articulo":"01962982","Cascos":8,"tasa_pct":37.5,"Valor_Rechazo":95,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01641200","Cascos":5,"tasa_pct":40,"Valor_Rechazo":95,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04551700","Cascos":9,"tasa_pct":33.3,"Valor_Rechazo":93,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08265350","Cascos":7,"tasa_pct":28.6,"Valor_Rechazo":92,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01491500","Cascos":4,"tasa_pct":25,"Valor_Rechazo":91,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04130060","Cascos":28,"tasa_pct":21.4,"Valor_Rechazo":90,"riesgo":"Bajo rechazo"},{"Articulo":"R0986435003","Cascos":10,"tasa_pct":60,"Valor_Rechazo":87,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04940110","Cascos":10,"tasa_pct":50,"Valor_Rechazo":85,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06932900","Cascos":5,"tasa_pct":60,"Valor_Rechazo":82,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"R0986435146","Cascos":7,"tasa_pct":28.6,"Valor_Rechazo":82,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01931560","Cascos":11,"tasa_pct":9.1,"Valor_Rechazo":81,"riesgo":"Bajo rechazo"},{"Articulo":"01162300","Cascos":14,"tasa_pct":14.3,"Valor_Rechazo":81,"riesgo":"Bajo rechazo"},{"Articulo":"01162030","Cascos":3,"tasa_pct":33.3,"Valor_Rechazo":79,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01963100","Cascos":2,"tasa_pct":50,"Valor_Rechazo":76,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01627600","Cascos":13,"tasa_pct":15.4,"Valor_Rechazo":72,"riesgo":"Bajo rechazo"},{"Articulo":"R0986437023","Cascos":10,"tasa_pct":20,"Valor_Rechazo":72,"riesgo":"Bajo rechazo"},{"Articulo":"01283285","Cascos":9,"tasa_pct":11.1,"Valor_Rechazo":71,"riesgo":"Bajo rechazo"},{"Articulo":"01625605","Cascos":6,"tasa_pct":20,"Valor_Rechazo":70,"riesgo":"Bajo rechazo"},{"Articulo":"08263503","Cascos":2,"tasa_pct":50,"Valor_Rechazo":70,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"08441060","Cascos":1,"tasa_pct":100,"Valor_Rechazo":70,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"08700500","Cascos":16,"tasa_pct":6.2,"Valor_Rechazo":70,"riesgo":"Bajo rechazo"},{"Articulo":"08621301","Cascos":10,"tasa_pct":10,"Valor_Rechazo":69,"riesgo":"Bajo rechazo"},{"Articulo":"04940394-2","Cascos":7,"tasa_pct":57.1,"Valor_Rechazo":68,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01987005","Cascos":10,"tasa_pct":10,"Valor_Rechazo":68,"riesgo":"Bajo rechazo"},{"Articulo":"06873004","Cascos":8,"tasa_pct":12.5,"Valor_Rechazo":67,"riesgo":"Bajo rechazo"},{"Articulo":"04551211","Cascos":6,"tasa_pct":16.7,"Valor_Rechazo":66,"riesgo":"Bajo rechazo"},{"Articulo":"R02801D","Cascos":7,"tasa_pct":42.9,"Valor_Rechazo":66,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04550916","Cascos":4,"tasa_pct":25,"Valor_Rechazo":65,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"06265360","Cascos":16,"tasa_pct":31.2,"Valor_Rechazo":63,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04230157","Cascos":5,"tasa_pct":60,"Valor_Rechazo":63,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"01283224","Cascos":10,"tasa_pct":10,"Valor_Rechazo":62,"riesgo":"Bajo rechazo"},{"Articulo":"01627807","Cascos":15,"tasa_pct":6.7,"Valor_Rechazo":58,"riesgo":"Bajo rechazo"},{"Articulo":"01011600","Cascos":6,"tasa_pct":16.7,"Valor_Rechazo":57,"riesgo":"Bajo rechazo"},{"Articulo":"01706050","Cascos":16,"tasa_pct":6.2,"Valor_Rechazo":57,"riesgo":"Bajo rechazo"},{"Articulo":"01986008","Cascos":2,"tasa_pct":50,"Valor_Rechazo":54,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04710190","Cascos":10,"tasa_pct":30,"Valor_Rechazo":54,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04710187","Cascos":14,"tasa_pct":14.3,"Valor_Rechazo":52,"riesgo":"Bajo rechazo"},{"Articulo":"R0986435506","Cascos":10,"tasa_pct":20,"Valor_Rechazo":52,"riesgo":"Bajo rechazo"},{"Articulo":"06640100","Cascos":6,"tasa_pct":16.7,"Valor_Rechazo":51,"riesgo":"Bajo rechazo"},{"Articulo":"06701650","Cascos":9,"tasa_pct":25,"Valor_Rechazo":51,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"02701110","Cascos":11,"tasa_pct":27.3,"Valor_Rechazo":50,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01627802","Cascos":11,"tasa_pct":10,"Valor_Rechazo":49,"riesgo":"Bajo rechazo"},{"Articulo":"R5WS40019","Cascos":10,"tasa_pct":10,"Valor_Rechazo":41,"riesgo":"Bajo rechazo"},{"Articulo":"02700800","Cascos":3,"tasa_pct":100,"Valor_Rechazo":39,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"01162560","Cascos":2,"tasa_pct":50,"Valor_Rechazo":36,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"01283202","Cascos":1,"tasa_pct":100,"Valor_Rechazo":34,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"04160020","Cascos":6,"tasa_pct":33.3,"Valor_Rechazo":34,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04130081-2","Cascos":10,"tasa_pct":10,"Valor_Rechazo":26,"riesgo":"Bajo rechazo"},{"Articulo":"06966000","Cascos":7,"tasa_pct":14.3,"Valor_Rechazo":26,"riesgo":"Bajo rechazo"},{"Articulo":"R0986435102","Cascos":6,"tasa_pct":16.7,"Valor_Rechazo":25,"riesgo":"Bajo rechazo"},{"Articulo":"04880130","Cascos":4,"tasa_pct":25,"Valor_Rechazo":25,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04130098-1","Cascos":5,"tasa_pct":20,"Valor_Rechazo":24,"riesgo":"Bajo rechazo"},{"Articulo":"04070370","Cascos":9,"tasa_pct":22.2,"Valor_Rechazo":22,"riesgo":"Bajo rechazo"},{"Articulo":"04070281","Cascos":5,"tasa_pct":20,"Valor_Rechazo":21,"riesgo":"Bajo rechazo"},{"Articulo":"R00101D","Cascos":16,"tasa_pct":6.2,"Valor_Rechazo":21,"riesgo":"Bajo rechazo"},{"Articulo":"R0445110252","Cascos":9,"tasa_pct":11.1,"Valor_Rechazo":21,"riesgo":"Bajo rechazo"},{"Articulo":"R0986435150","Cascos":14,"tasa_pct":7.1,"Valor_Rechazo":21,"riesgo":"Bajo rechazo"},{"Articulo":"04940425-1","Cascos":3,"tasa_pct":33.3,"Valor_Rechazo":20,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04130071","Cascos":12,"tasa_pct":8.3,"Valor_Rechazo":19,"riesgo":"Bajo rechazo"},{"Articulo":"04520096","Cascos":2,"tasa_pct":50,"Valor_Rechazo":19,"riesgo":"Baja prod, alto rechazo"},{"Articulo":"04070372","Cascos":6,"tasa_pct":16.7,"Valor_Rechazo":18,"riesgo":"Bajo rechazo"},{"Articulo":"04070140-1","Cascos":9,"tasa_pct":11.1,"Valor_Rechazo":18,"riesgo":"Bajo rechazo"},{"Articulo":"04880304-2","Cascos":12,"tasa_pct":8.3,"Valor_Rechazo":18,"riesgo":"Bajo rechazo"},{"Articulo":"04360307","Cascos":8,"tasa_pct":12.5,"Valor_Rechazo":17,"riesgo":"Bajo rechazo"},{"Articulo":"04760101-1","Cascos":1,"tasa_pct":100,"Valor_Rechazo":17,"riesgo":"Crítico (≤5 cascos, >50%)"},{"Articulo":"04070381-1","Cascos":11,"tasa_pct":9.1,"Valor_Rechazo":16,"riesgo":"Bajo rechazo"}];

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const seg = SEGMENTOS[payload.riesgo] || { color: C.gris };
  const r = Math.max(4, Math.min(36, Math.pow(payload.Valor_Rechazo, 0.55) * 0.18));
  return <circle cx={cx} cy={cy} r={r} fill={seg.color} fillOpacity={0.75} stroke={seg.color} strokeWidth={1} />;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const seg = SEGMENTOS[d.riesgo] || {};
  return (
    <div style={{ background: "#1a2a3a", border: `1px solid ${C.borde}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: C.blanco, fontWeight: 700, marginBottom: 4, fontFamily: "monospace" }}>{d.Articulo}</div>
      <div style={{ color: C.gris }}>Cascos: <b style={{ color: C.blanco }}>{d.Cascos}</b></div>
      <div style={{ color: C.gris }}>Tasa rechazo: <b style={{ color: seg.color || C.blanco }}>{d.tasa_pct}%</b></div>
      <div style={{ color: C.gris }}>Valor rechazo: <b style={{ color: C.blanco }}>{d.Valor_Rechazo}€</b></div>
      <div style={{ marginTop: 4, color: seg.color || C.gris, fontSize: 11 }}>{seg.emoji} {d.riesgo}</div>
    </div>
  );
};

export default function Dashboard() {
  const [filtro, setFiltro] = useState("Todos");
  const [tab, setTab] = useState(0);
  const [filtroTramo, setFiltroTramo] = useState("Todos");

  const scatterFiltrado = useMemo(() =>
    filtro === "Todos" ? rawScatter : rawScatter.filter(d => d.riesgo === filtro),
    [filtro]
  );

  const conteos = useMemo(() => {
    const c = {};
    Object.keys(SEGMENTOS).forEach(k => { c[k] = rawScatter.filter(d => d.riesgo === k).length; });
    return c;
  }, []);

  const tabs = ["Scatter: Producción vs Rechazo", "Análisis por Tramo", "Referencias Críticas"];

  return (
    <div style={{ background: C.fondo, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: C.texto, padding: "24px 28px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');*{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
          <div style={{ width: 4, height: 26, background: "#3080F0", borderRadius: 2 }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.blanco }}>Producción vs Rechazo por Referencia</h1>
          <span style={{ background: "#1A2E45", color: C.gris, fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>Febrero 2026</span>
        </div>
        <p style={{ margin: "0 0 0 14px", fontSize: 12, color: C.gris }}>LIZARTE ON · Solo referencias con producción en el mes</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { l: "Refs activas (prod > 0)", v: "76",      s: "de 168 totales",              c: C.azul },
          { l: "Valor rechazo total",     v: "33.328€", s: "59 refs con rechazo",          c: C.naranja },
          { l: "Tasa global",             v: "21.95%",  s: "410 uds rechazadas / 1.874",  c: C.rojo },
          { l: "Críticas (≤5 cascos, >50%)", v: "4 refs", s: "3 con 100% rechazado",       c: C.critico },
        ].map((k, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 10, padding: "16px 20px", flex: "1 1 150px" }}>
            <div style={{ fontSize: 11, color: C.gris, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{k.l}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: k.c, fontFamily: "'JetBrains Mono'" }}>{k.v}</div>
            {k.s && <div style={{ fontSize: 11, color: C.gris, marginTop: 3 }}>{k.s}</div>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, marginBottom: 20, borderBottom: `1px solid ${C.borde}` }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            background: tab === i ? C.azul : "transparent", border: "none",
            color: tab === i ? "#fff" : C.gris, padding: "8px 16px",
            borderRadius: "8px 8px 0 0", cursor: "pointer", fontSize: 13,
            fontWeight: tab === i ? 600 : 400, fontFamily: "inherit", transition: "all 0.15s"
          }}>{t}</button>
        ))}
      </div>

      {/* TAB 0 — SCATTER */}
      {tab === 0 && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["Todos", ...Object.keys(SEGMENTOS)].map(s => {
              const seg = SEGMENTOS[s] || {};
              const n = s === "Todos" ? rawScatter.length : conteos[s];
              const active = filtro === s;
              return (
                <button key={s} onClick={() => setFiltro(s)} style={{
                  background: active ? (seg.color || C.azul) + "22" : "transparent",
                  border: `1px solid ${active ? (seg.color || C.azul) : C.borde}`,
                  color: active ? (seg.color || C.azul) : C.gris,
                  padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12,
                  fontFamily: "inherit", transition: "all 0.15s"
                }}>
                  {seg.emoji || "⚪"} {s} <span style={{ opacity: 0.7 }}>({n})</span>
                </button>
              );
            })}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: C.gris, marginBottom: 12 }}>
              Eje X: Cascos producidos · Eje Y: Tasa de rechazo (%) · Tamaño burbuja: Valor €
            </div>
            <ResponsiveContainer width="100%" height={440}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borde} />
                <XAxis type="number" dataKey="Cascos" name="Cascos" tick={{ fill: C.gris, fontSize: 11 }} label={{ value: "Cascos producidos", position: "insideBottom", fill: C.gris, fontSize: 12, dy: 15 }} />
                <YAxis type="number" dataKey="tasa_pct" name="Tasa" tick={{ fill: C.gris, fontSize: 11 }} label={{ value: "Tasa rechazo %", angle: -90, position: "insideLeft", fill: C.gris, fontSize: 12, dx: -5 }} domain={[0, 110]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={23.35} stroke={C.azul} strokeDasharray="5 5" label={{ value: "Media global 23.4%", fill: C.azul, fontSize: 10, position: "right" }} />
                <ReferenceLine x={20} stroke={C.naranja} strokeDasharray="5 5" label={{ value: "Umbral baja prod", fill: C.naranja, fontSize: 10, position: "top" }} />
                <Scatter data={scatterFiltrado} shape={<CustomDot />} />
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap", fontSize: 12 }}>
              {Object.entries(SEGMENTOS).map(([k, v]) => (
                <span key={k} style={{ color: v.color }}>{v.emoji} {k}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1 — TRAMOS */}
      {tab === 1 && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 20, flex: "1 1 400px" }}>
            <div style={{ fontSize: 12, color: C.gris, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Tasa Media de Rechazo por Tramo de Producción</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resumenTramo} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borde} />
                <XAxis dataKey="tramo" tick={{ fill: C.gris, fontSize: 11 }} />
                <YAxis tick={{ fill: C.gris, fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 70]} />
                <Tooltip formatter={v => [`${v}%`, "Tasa media"]} contentStyle={{ background: "#1a2a3a", border: `1px solid ${C.borde}`, borderRadius: 8, fontSize: 13 }} />
                <ReferenceLine y={23.35} stroke={C.azul} strokeDasharray="4 4" label={{ value: "Media global", fill: C.azul, fontSize: 10 }} />
                <Bar dataKey="tasa_media" name="Tasa media %" radius={[4, 4, 0, 0]}>
                  {resumenTramo.map((d, i) => (
                    <Cell key={i} fill={TRAMO_COLORS[d.tramo] || C.azul} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 20, flex: "1 1 400px" }}>
            <div style={{ fontSize: 12, color: C.gris, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Valor de Rechazo (€) por Tramo de Producción</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {/* Tarta */}
              <div style={{ flex: "0 0 200px" }}>
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={resumenTramo}
                      dataKey="valor_rechazo"
                      nameKey="tramo"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {resumenTramo.map((d, i) => (
                        <Cell key={i} fill={TRAMO_COLORS[d.tramo] || C.azul} />
                      ))}
                    </Pie>
                    <Tooltip formatter={v => [`${v.toLocaleString("es-ES")}€`, "Valor rechazo"]} contentStyle={{ background: "#1a2a3a", border: `1px solid ${C.borde}`, borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Leyenda + barras */}
              <div style={{ flex: 1, minWidth: 160 }}>
                {(() => {
                  const total = resumenTramo.reduce((s, d) => s + d.valor_rechazo, 0);
                  return resumenTramo.slice().reverse().map((d, i) => {
                    const pct = (d.valor_rechazo / total * 100).toFixed(1);
                    const color = TRAMO_COLORS[d.tramo] || C.azul;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ width: 80, color: C.gris, flexShrink: 0 }}>{d.tramo}</span>
                        <div style={{ flex: 1, height: 14, background: C.borde, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, opacity: 0.85 }} />
                        </div>
                        <span style={{ width: 36, textAlign: "right", fontFamily: "'JetBrains Mono'", color: C.blanco, flexShrink: 0, fontSize: 11 }}>{pct}%</span>
                        <span style={{ width: 38, textAlign: "right", fontFamily: "'JetBrains Mono'", color: C.naranja, fontSize: 11, flexShrink: 0 }}>{d.refs_con_rechazo} refs</span>
                        <span style={{ width: 50, textAlign: "right", fontFamily: "'JetBrains Mono'", color: C.azul, fontSize: 11, flexShrink: 0 }}>{d.total_cascos.toLocaleString("es-ES")} ud</span>
                        <span style={{ width: 68, textAlign: "right", fontFamily: "'JetBrains Mono'", color: C.gris, fontSize: 11, flexShrink: 0 }}>{d.valor_rechazo.toLocaleString("es-ES")}€</span>
                      </div>
                    );
                  });
                })()}
                <div style={{ borderTop: `1px solid ${C.borde}`, marginTop: 6, paddingTop: 6, fontSize: 11, color: C.gris, display: "flex", justifyContent: "flex-end", gap: 16, fontFamily: "'JetBrains Mono'" }}>
                  <span style={{ color: C.naranja }}>{resumenTramo.reduce((s,d) => s + d.refs_con_rechazo, 0)} refs</span>
                  <span style={{ color: C.azul }}>{resumenTramo.reduce((s,d) => s + d.total_cascos, 0).toLocaleString("es-ES")} ud</span>
                  <span>Total: {resumenTramo.reduce((s,d) => s + d.valor_rechazo, 0).toLocaleString("es-ES")}€</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 20, flex: "1 1 100%", overflowX: "auto" }}>
            <div style={{ fontSize: 12, color: C.gris, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Tabla Resumen Completa</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.borde}` }}>
                  {["Tramo producción", "Total refs activas", "Tasa media de rechazo", "Refs >50%", "Total cascos", "Valor rechazo €", "€ rechazo/casco"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", color: C.gris, fontWeight: 500, textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumenTramo.map((d, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.borde}20`, background: i % 2 === 0 ? "#0D1520" : "transparent" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: C.blanco }}>{d.tramo}</td>
                    <td style={{ padding: "8px 12px" }}>{d.refs_total}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ color: TRAMO_COLORS[d.tramo] || C.azul, fontWeight: 600 }}>
                        {d.tasa_media}%
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ color: d.refs_gt50 > 0 ? C.rojo : C.verde }}>{d.refs_gt50}</span>
                    </td>
                    <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono'", color: C.azul }}>{d.total_cascos.toLocaleString("es-ES")}</td>
                    <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono'" }}>{d.valor_rechazo.toLocaleString("es-ES")}€</td>
                    <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono'", color: TRAMO_COLORS[d.tramo] || C.azul, fontWeight: 600 }}>
                      {(d.valor_rechazo / d.total_cascos).toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2 — TOP VALOR RECHAZO */}
      {tab === 2 && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {/* KPIs */}
          <div style={{ display: "flex", gap: 10, flex: "1 1 100%", flexWrap: "wrap" }}>
            {[
              { label: "Top 5 concentran",       val: "11.619€", color: C.rojo,    sub: "35% del rechazo total" },
              { label: "Top 10 concentran",       val: "16.806€", color: C.naranja, sub: "50% del rechazo total" },
              { label: "Tramo dominante",         val: ">50 cascos", color: C.azul, sub: "13 de las 20 refs son de alto volumen" },
              { label: "Refs fuera de objetivo",  val: "12 / 20",  color: C.critico, sub: "60% de las top 20 superan su obj." },
            ].map((k, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${k.color}30`, borderRadius: 10, padding: "14px 18px", flex: "1 1 160px" }}>
                <div style={{ fontSize: 11, color: C.gris, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: "'JetBrains Mono'" }}>{k.val}</div>
                <div style={{ fontSize: 11, color: C.gris, marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.borde}`, borderRadius: 12, padding: 20, flex: "1 1 100%", overflowX: "auto" }}>
            <div style={{ fontSize: 12, color: C.naranja, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>🏆 Top 20 — Referencias con mayor valor de rechazo</div>
            <div style={{ fontSize: 12, color: C.gris, marginBottom: 12 }}>Ordenadas por valor de rechazo descendente · Incluye tramo de producción para contextualizar el problema</div>

            {/* Filtros tramo */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {["Todos", ">50 cascos", "21-50 cascos", "11-20 cascos", "6-10 cascos", "1-5 cascos"].map(t => {
                const active = filtroTramo === t;
                const col = t === "Todos" ? C.gris : TRAMO_COLORS[t];
                return (
                  <button key={t} onClick={() => setFiltroTramo(t)} style={{
                    padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${active ? col : C.borde}`,
                    background: active ? col + "22" : "transparent",
                    color: active ? col : C.gris,
                    transition: "all 0.15s"
                  }}>{t}</button>
                );
              })}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.borde}` }}>
                  {["#", "Referencia", "Tramo", "Cascos", "Tasa real", "Uds rechazadas", "Valor rechazo"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", color: C.gris, fontWeight: 500, textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
  { art: "06282502", cascos: 122, tramo: ">50 cascos", tasa: 28.9, uds: 35, valor: 5140.1, mc: 39.5, mc_p: 2029 },
  { art: "06805000", cascos: 120, tramo: ">50 cascos", tasa: 17.5, uds: 21, valor: 2501.73, mc: 20.3, mc_p: 508 },
  { art: "06964700", cascos: 52, tramo: ">50 cascos", tasa: 31.4, uds: 16, valor: 1899.68, mc: 21.2, mc_p: 403 },
  { art: "06964000", cascos: 103, tramo: ">50 cascos", tasa: 27.2, uds: 28, valor: 1716.96, mc: 25.3, mc_p: 434 },
  { art: "06561000", cascos: 85, tramo: ">50 cascos", tasa: 17.6, uds: 15, valor: 1348.95, mc: 18.0, mc_p: 242 },
  { art: "E06091800", cascos: 67, tramo: ">50 cascos", tasa: 38.8, uds: 26, valor: 1326.0, mc: 53.7, mc_p: 712 },
  { art: "06641500", cascos: 73, tramo: ">50 cascos", tasa: 15.1, uds: 11, valor: 957.77, mc: 60.0, mc_p: 575 },
  { art: "04550802", cascos: 53, tramo: ">50 cascos", tasa: 26.4, uds: 14, valor: 954.8, mc: 14.0, mc_p: 134 },
  { art: "E06091105", cascos: 58, tramo: ">50 cascos", tasa: 31.0, uds: 18, valor: 918.0, mc: 54.0, mc_p: 495 },
  { art: "06641600", cascos: 59, tramo: ">50 cascos", tasa: 16.9, uds: 10, valor: 812.1, mc: 34.0, mc_p: 276 },
  { art: "06562550", cascos: 27, tramo: "21-50 cascos", tasa: 29.6, uds: 8, valor: 808.0, mc: 16.6, mc_p: 134 },
  { art: "06282500", cascos: 26, tramo: "21-50 cascos", tasa: 23.1, uds: 6, valor: 793.32, mc: 36.1, mc_p: 286 },
  { art: "06641250", cascos: 129, tramo: ">50 cascos", tasa: 7.8, uds: 10, valor: 792.0, mc: 29.7, mc_p: 235 },
  { art: "08264500", cascos: 62, tramo: ">50 cascos", tasa: 17.7, uds: 11, valor: 779.13, mc: 41.0, mc_p: 320 },
  { art: "04550500", cascos: 73, tramo: ">50 cascos", tasa: 16.4, uds: 12, valor: 724.8, mc: 31.9, mc_p: 231 },
  { art: "04551400", cascos: 48, tramo: "21-50 cascos", tasa: 27.1, uds: 13, valor: 668.72, mc: 19.0, mc_p: 127 },
  { art: "06965503", cascos: 31, tramo: "21-50 cascos", tasa: 45.5, uds: 5, valor: 595.65, mc: 22.3, mc_p: 133 },
  { art: "08621200", cascos: 21, tramo: "21-50 cascos", tasa: 42.9, uds: 9, valor: 594.0, mc: 36.7, mc_p: 218 },
  { art: "08700900", cascos: 13, tramo: "11-20 cascos", tasa: 53.8, uds: 7, valor: 490.0, mc: 50.0, mc_p: 245 },
  { art: "06161601", cascos: 15, tramo: "11-20 cascos", tasa: 40.0, uds: 6, valor: 455.58, mc: 18.5, mc_p: 84 },
  { art: "06562500", cascos: 28, tramo: "21-50 cascos", tasa: 15.4, uds: 4, valor: 450.64, mc: 16.6, mc_p: 75 },
  { art: "06641000", cascos: 58, tramo: ">50 cascos", tasa: 13.7, uds: 7, valor: 432.74, mc: 41.8, mc_p: 181 },
  { art: "04551200", cascos: 12, tramo: "11-20 cascos", tasa: 58.3, uds: 7, valor: 407.54, mc: 40.9, mc_p: 167 },
  { art: "06091000", cascos: 8, tramo: "6-10 cascos", tasa: 37.5, uds: 3, valor: 397.32, mc: 18.1, mc_p: 72 },
  { art: "04550910", cascos: 35, tramo: "21-50 cascos", tasa: 20.0, uds: 7, valor: 386.54, mc: 48.9, mc_p: 189 },
  { art: "06873000", cascos: 26, tramo: "21-50 cascos", tasa: 19.2, uds: 5, valor: 384.9, mc: 25.9, mc_p: 100 },
  { art: "06706006", cascos: 8, tramo: "6-10 cascos", tasa: 62.5, uds: 5, valor: 366.95, mc: 6.4, mc_p: 24 },
  { art: "04552501", cascos: 7, tramo: "6-10 cascos", tasa: 100.0, uds: 6, valor: 366.0, mc: 30.2, mc_p: 111 },
  { art: "06873010", cascos: 36, tramo: "21-50 cascos", tasa: 13.9, uds: 5, valor: 352.7, mc: 13.9, mc_p: 49 },
  { art: "08966000", cascos: 7, tramo: "6-10 cascos", tasa: 71.4, uds: 5, valor: 350.0, mc: 0.0, mc_p: 0 },
  { art: "08265002", cascos: 17, tramo: "11-20 cascos", tasa: 33.3, uds: 5, valor: 333.55, mc: 31.4, mc_p: 105 },
  { art: "06161560", cascos: 52, tramo: ">50 cascos", tasa: 18.0, uds: 9, valor: 324.0, mc: 37.4, mc_p: 121 },
  { art: "04550902", cascos: 15, tramo: "11-20 cascos", tasa: 40.0, uds: 6, valor: 306.78, mc: 42.1, mc_p: 129 },
  { art: "04551210", cascos: 12, tramo: "11-20 cascos", tasa: 41.7, uds: 5, valor: 305.7, mc: 56.3, mc_p: 172 },
  { art: "04550960", cascos: 12, tramo: "11-20 cascos", tasa: 41.7, uds: 5, valor: 305.0, mc: 44.3, mc_p: 135 },
  { art: "04551020", cascos: 18, tramo: "11-20 cascos", tasa: 27.8, uds: 5, valor: 305.0, mc: 17.1, mc_p: 52 },
  { art: "04551000", cascos: 9, tramo: "6-10 cascos", tasa: 66.7, uds: 6, valor: 291.0, mc: -1.8, mc_p: 0 },
  { art: "04550930", cascos: 10, tramo: "6-10 cascos", tasa: 40.0, uds: 4, valor: 278.52, mc: 49.3, mc_p: 137 },
  { art: "04550937", cascos: 7, tramo: "6-10 cascos", tasa: 57.1, uds: 4, valor: 244.0, mc: 24.9, mc_p: 61 },
  { art: "04551525", cascos: 6, tramo: "6-10 cascos", tasa: 66.7, uds: 4, valor: 244.0, mc: 8.4, mc_p: 20 },
                ].filter(d => filtroTramo === "Todos" || d.tramo === filtroTramo)
                 .map((d, i) => {
                  const tramColor = TRAMO_COLORS[d.tramo] || C.azul;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.borde}20`, background: i % 2 === 0 ? "#0d1520" : "transparent" }}>
                      <td style={{ padding: "9px 10px", color: C.gris, fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{i + 1}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "'JetBrains Mono'", fontWeight: 700, color: C.blanco }}>{d.art}</td>
                      <td style={{ padding: "9px 10px" }}>
                        <span style={{ background: tramColor + "22", color: tramColor, border: `1px solid ${tramColor}44`, borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{d.tramo}</span>
                      </td>
                      <td style={{ padding: "9px 10px", color: C.gris, textAlign: "center" }}>{d.cascos}</td>
                      <td style={{ padding: "9px 10px", fontWeight: 700, color: d.tasa >= 50 ? C.rojo : d.tasa >= 25 ? C.naranja : C.texto }}>{d.tasa}%</td>
                      <td style={{ padding: "9px 10px", color: C.gris, textAlign: "center" }}>{d.uds}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "'JetBrains Mono'", color: C.naranja, fontWeight: 600 }}>{d.valor.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

          </div>
        </div>
      )}

    </div>
  );
}
