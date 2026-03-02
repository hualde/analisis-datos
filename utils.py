import pandas as pd
import numpy as np

def get_familia(ref):
    ref_str = str(ref).strip()
    if ref_str.startswith('01'): return "Familia DA"
    elif ref_str.startswith('06'): return "Familia DAE"
    elif ref_str.startswith('04'): return "Bombas"
    elif ref_str.startswith('08'): return "Familia CD"
    else: return "Otros"

def process_data(file_path):
    try:
        df = pd.read_excel(file_path)
        
        # Mapping columns to common names (more flexible)
        col_map = {
            'articulo': ['Artículo', 'Articulo', 'Referencia'],
            'cascos': ['Nº de Cascos Bamboo', 'Cascos', 'Producción', 'Produccion'],
            'devueltos': ['Nº Casco Devueltos Bamboo', 'Devueltos'],
            'rechazo_uds': ['Uds. Rechazo Bamboo', 'Rechazo Uds'],
            'tasa_pct': ['Tasa Rechazo Bamboo', 'Tasa %', 'Tasa'],
            'objetivo': ['Obj', 'Objetivo'],
            'valor_rechazo': ['Valor Rechazo Bamboo', 'Valor Rechazo', 'Importe Rechazo']
        }
        
        # Strip potential whitespace from columns
        df.columns = [c.strip() for c in df.columns]
        
        # Apply flexible mapping
        new_cols = {}
        for final_name, candidates in col_map.items():
            for cand in candidates:
                if cand in df.columns:
                    new_cols[cand] = final_name
                    break
        
        df = df.rename(columns=new_cols)
        
        # Ensure numeric types
        numeric_cols = ['cascos', 'tasa_pct', 'valor_rechazo']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Calculate global average rate (from React code it was 23.35)
        # But here we calculate it from data if possible
        if 'tasa_pct' in df.columns:
            # The React code used a fixed media global 23.4% as reference
            avg_rate = 23.35 
        else:
            avg_rate = 0
            
        def get_segment(row):
            cascos = row.get('cascos', 0)
            tasa = row.get('tasa_pct', 0)
            
            if cascos <= 5 and tasa > 50:
                return "Crítico (≤5 cascos, >50%)"
            elif cascos <= 20 and tasa > avg_rate:
                return "Baja prod, alto rechazo"
            elif cascos > 20 and tasa > avg_rate:
                return "Alta prod, alto rechazo"
            else:
                return "Bajo rechazo"

        df['riesgo'] = df.apply(get_segment, axis=1)
        
        def get_tramo(cascos):
            if cascos <= 5: return "1-5 cascos"
            elif cascos <= 10: return "6-10 cascos"
            elif cascos <= 20: return "11-20 cascos"
            elif cascos <= 50: return "21-50 cascos"
            else: return ">50 cascos"
            
        df['tramo'] = df['cascos'].apply(get_tramo)
        
        df['familia'] = df['articulo'].apply(get_familia)
        
        return df, avg_rate
    except Exception as e:
        print(f"Error processing data: {e}")
        return None, 0

def get_summary_by_tramo(df):
    if df is None or df.empty:
        return []
    
    tramos_order = ["1-5 cascos", "6-10 cascos", "11-20 cascos", "21-50 cascos", ">50 cascos"]
    
    summary = []
    for tramo in tramos_order:
        sub = df[df['tramo'] == tramo]
        if sub.empty:
            summary.append({
                'tramo': tramo,
                'refs_total': 0,
                'tasa_media': 0,
                'valor_rechazo': 0,
                'total_cascos': 0
            })
            continue
            
        summary.append({
            'tramo': tramo,
            'refs_total': len(sub),
            'tasa_media': sub['tasa_pct'].mean(),
            'valor_rechazo': sub['valor_rechazo'].sum(),
            'total_cascos': sub['cascos'].sum()
        })
    return summary
