import * as XLSX from 'xlsx';

export const getFamily = (ref) => {
    const refStr = String(ref || '').trim().toUpperCase();
    if (refStr.startsWith('01')) return "Familia DA";
    if (refStr.startsWith('06') || refStr.startsWith('E06')) return "Familia DAE";
    if (refStr.startsWith('04')) return "Bombas";
    if (refStr.startsWith('08')) return "Familia CD";
    return "Otros";
};

export const processExcelArrayBuffer = (arrayBuffer) => {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const colMap = {
        'articulo': ['Artículo', 'Articulo', 'Referencia'],
        'cascos': ['Nº de Cascos Bamboo', 'Cascos', 'Producción', 'Produccion'],
        'devueltos': ['Nº Casco Devueltos Bamboo', 'Devueltos'],
        'rechazo_uds': ['Uds. Rechazo Bamboo', 'Rechazo Uds'],
        'tasa_pct': ['Tasa Rechazo Bamboo', 'Tasa %', 'Tasa'],
        'objetivo': ['Obj', 'Objetivo'],
        'valor_rechazo': ['Valor Rechazo Bamboo', 'Valor Rechazo', 'Importe Rechazo']
    };

    const processedData = jsonData
        .map(row => {
            const newRow = {};
            Object.keys(colMap).forEach(finalKey => {
                const candidates = colMap[finalKey];
                const sourceKey = Object.keys(row).find(k => candidates.includes(k.trim()));
                newRow[finalKey] = sourceKey !== undefined ? row[sourceKey] : 0;
            });

            // Ensure numeric values
            newRow.cascos = parseFloat(newRow.cascos) || 0;
            let rawTasa = parseFloat(newRow.tasa_pct) || 0;

            if (rawTasa > 0 && rawTasa <= 1) {
                rawTasa = rawTasa * 100;
            }
            newRow.tasa_pct = rawTasa;

            newRow.valor_rechazo = parseFloat(newRow.valor_rechazo) || 0;
            newRow.rechazo_uds = parseFloat(newRow.rechazo_uds) || 0;

            // Clean article name
            newRow.articulo = String(newRow.articulo || '').trim();

            // Segmentation
            const avgRate = 23.35;
            if (newRow.cascos <= 5 && newRow.tasa_pct > 50) {
                newRow.riesgo = "Crítico (≤5 cascos, >50%)";
            } else if (newRow.cascos <= 20 && newRow.tasa_pct > avgRate) {
                newRow.riesgo = "Baja prod, alto rechazo";
            } else if (newRow.cascos > 20 && newRow.tasa_pct > avgRate) {
                newRow.riesgo = "Alta prod, alto rechazo";
            } else {
                newRow.riesgo = "Bajo rechazo";
            }

            // Tranche
            if (newRow.cascos <= 5) newRow.tramo = "1-5 cascos";
            else if (newRow.cascos <= 10) newRow.tramo = "6-10 cascos";
            else if (newRow.cascos <= 20) newRow.tramo = "11-20 cascos";
            else if (newRow.cascos <= 50) newRow.tramo = "21-50 cascos";
            else newRow.tramo = ">50 cascos";

            // Family
            newRow.familia = getFamily(newRow.articulo);

            return newRow;
        })
        .filter(d => d.cascos > 0 && d.articulo !== '' && d.articulo !== '0');

    return {
        data: processedData,
        avgRate: 23.35,
        totalRechazo: processedData.reduce((acc, curr) => acc + curr.valor_rechazo, 0),
        totalCascos: processedData.reduce((acc, curr) => acc + curr.cascos, 0),
        totalUdsRechazo: processedData.reduce((acc, curr) => acc + curr.rechazo_uds, 0),
    };
};

export const processExcelData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                resolve(processExcelArrayBuffer(e.target.result));
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

export const COLORS = {
    fondo: "#0D1520", card: "#111E2E", borde: "#1A2E45",
    texto: "#C8D8E8", blanco: "#EEF4FA", gris: "#6A8099",
    rojo: "#E03A3A", naranja: "#F07830", amarillo: "#E8C020",
    verde: "#28B86A", azul: "#3080F0", morado: "#9060E0",
    critico: "#FF2040",
};

export const SEGMENTOS = {
    "Crítico (≤5 cascos, >50%)": { color: COLORS.critico, emoji: "🔴" },
    "Baja prod, alto rechazo": { color: COLORS.naranja, emoji: "🟠" },
    "Alta prod, alto rechazo": { color: COLORS.amarillo, emoji: "🟡" },
    "Bajo rechazo": { color: COLORS.verde, emoji: "🟢" },
};

export const TRAMO_COLORS = {
    "1-5 cascos": "#FF3B3B",
    "6-10 cascos": "#F0833A",
    "11-20 cascos": "#F5C842",
    "21-50 cascos": "#3DD68C",
    ">50 cascos": "#3080F0",
};
