import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import utils
import os

# Set appearance mode and color theme
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

COLORS = {
    "fondo": "#0D1520",
    "card": "#111E2E",
    "borde": "#1A2E45",
    "texto": "#C8D8E8",
    "blanco": "#EEF4FA",
    "gris": "#6A8099",
    "rojo": "#E03A3A",
    "naranja": "#F07830",
    "amarillo": "#E8C020",
    "verde": "#28B86A",
    "azul": "#3080F0",
    "morado": "#9060E0",
    "critico": "#FF2040",
}

SEGMENT_COLORS = {
    "Crítico (≤5 cascos, >50%)": COLORS["critico"],
    "Baja prod, alto rechazo": COLORS["naranja"],
    "Alta prod, alto rechazo": COLORS["amarillo"],
    "Bajo rechazo": COLORS["verde"],
}

TRAMO_COLORS = {
    "1-5 cascos": "#FF3B3B",
    "6-10 cascos": "#F0833A",
    "11-20 cascos": "#F5C842",
    "21-50 cascos": "#3DD68C",
    ">50 cascos": "#3080F0",
}

class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Lizarte Dashboard - Producción vs Rechazo")
        self.geometry("1100x700")
        self.configure(fg_color=COLORS["fondo"])

        # Data state
        self.df = None
        self.avg_rate = 0
        self.summary_tramo = None
        self.selected_families = []

        # Start with Loading Frame
        self.show_loading_screen()

    def show_loading_screen(self):
        self.clear_window()
        
        frame = ctk.CTkFrame(self, fg_color="transparent")
        frame.pack(expand=True)

        label_title = ctk.CTkLabel(frame, text="Análisis de Producción vs Rechazo", 
                                  font=ctk.CTkFont(size=24, weight="bold"), text_color=COLORS["blanco"])
        label_title.pack(pady=(0, 10))

        label_subtitle = ctk.CTkLabel(frame, text="Seleccione el archivo Excel para comenzar la carga de datos", 
                                     font=ctk.CTkFont(size=14), text_color=COLORS["gris"])
        label_subtitle.pack(pady=(0, 30))

        btn_load = ctk.CTkButton(frame, text="Cargar Archivo Excel", 
                                command=self.load_file,
                                height=45, width=200,
                                font=ctk.CTkFont(size=15, weight="bold"),
                                fg_color=COLORS["azul"], hover_color="#2060C0")
        btn_load.pack()

    def load_file(self):
        file_path = filedialog.askopenfilename(filetypes=[("Excel files", "*.xlsx *.xls")])
        if file_path:
            self.df, self.avg_rate = utils.process_data(file_path)
            if self.df is not None:
                self.summary_tramo = utils.get_summary_by_tramo(self.df)
                self.show_dashboard()
            else:
                messagebox.showerror("Error", "No se pudo procesar el archivo. Verifique el formato.")

    def show_dashboard(self):
        self.clear_window()
        filtered_df = self.get_filtered_df()
        self.summary_tramo = utils.get_summary_by_tramo(filtered_df)
        
        # Header
        header = ctk.CTkFrame(self, fg_color=COLORS["card"], height=80, corner_radius=0)
        header.pack(fill="x", side="top")
        
        title_frame = ctk.CTkFrame(header, fg_color="transparent")
        title_frame.pack(side="left", padx=30, pady=15)
        
        accent = ctk.CTkFrame(title_frame, width=4, height=26, fg_color=COLORS["azul"])
        accent.pack(side="left", padx=(0, 10))
        
        title = ctk.CTkLabel(title_frame, text="Dashboard: Producción vs Rechazo", 
                            font=ctk.CTkFont(size=20, weight="bold"), text_color=COLORS["blanco"])
        title.pack(side="left")
        
        # Logout / Change file button
        btn_back = ctk.CTkButton(header, text="Cambiar Archivo", width=120, height=32,
                                fg_color=COLORS["borde"], text_color=COLORS["texto"],
                                command=self.show_loading_screen)
        btn_back.pack(side="right", padx=30)

        # Main content
        container = ctk.CTkFrame(self, fg_color="transparent")
        container.pack(fill="both", expand=True, padx=30, pady=20)

        # Family filters
        self.create_family_filters(container)

        # KPIs
        self.create_kpis(container, filtered_df)

        # Tabs
        self.tabview = ctk.CTkTabview(container, fg_color=COLORS["card"], 
                                     segmented_button_selected_color=COLORS["azul"],
                                     segmented_button_unselected_color=COLORS["borde"],
                                     text_color=COLORS["texto"])
        self.tabview.pack(fill="both", expand=True, pady=(20, 0))
        
        self.tabview.add("Dispersion")
        self.tabview.add("Por Tramo")
        self.tabview.add("Tabla de Datos")
        
        # Call setup methods
        self.setup_scatter_tab(filtered_df)
        self.setup_tramo_tab(filtered_df, self.summary_tramo)
        self.setup_table_tab(filtered_df)
        
        # Explicitly set the first tab
        self.tabview.set("Dispersion")

    def create_kpis(self, parent, df):
        kpi_frame = ctk.CTkFrame(parent, fg_color="transparent", height=130)
        kpi_frame.pack(fill="x")
        kpi_frame.pack_propagate(False)
        
        total_rechazo = df['valor_rechazo'].sum()
        total_cascos = df['cascos'].sum()
        global_rate = (df['rechazo_uds'].sum() / total_cascos * 100) if total_cascos > 0 else 0
        criticas = len(df[df['riesgo'].str.contains("Crítico")])
        
        print(f"DEBUG: Data loaded. Total rejection: {total_rechazo}, Critical refs: {criticas}")
        
        kpis = [
            ("Refs Activas", len(df), f"de {len(self.df)} totales", COLORS["azul"]),
            ("Valor Rechazo Total", f"{total_rechazo:,.0f}€".replace(",", "."), f"{len(df[df['valor_rechazo'] > 0])} refs con rechazo", COLORS["naranja"]),
            ("Tasa Global", f"{global_rate:.2f}%", f"{df['rechazo_uds'].sum():,.0f} uds rechazadas".replace(",", "."), COLORS["rojo"]),
            ("Refs Críticas", f"{criticas}", "Requieren acción inmediata", COLORS["critico"])
        ]
        
        for i, (label, val, sub, col) in enumerate(kpis):
            card = ctk.CTkFrame(kpi_frame, fg_color=COLORS["card"], border_color=COLORS["borde"], border_width=1)
            card.pack(side="left", expand=True, fill="both", padx=(0 if i==0 else 10, 0))
            
            l = ctk.CTkLabel(card, text=label.upper(), font=ctk.CTkFont(size=11, weight="bold"), text_color=COLORS["gris"])
            l.pack(anchor="w", padx=15, pady=(15, 0))
            
            v = ctk.CTkLabel(card, text=val, font=ctk.CTkFont(size=26, weight="bold"), text_color=col)
            v.pack(anchor="w", padx=15, pady=0)
            
            s = ctk.CTkLabel(card, text=sub, font=ctk.CTkFont(size=11), text_color=COLORS["gris"])
            s.pack(anchor="w", padx=15, pady=(0, 15))

    def setup_scatter_tab(self, df):
        print("DEBUG: Setting up Scatter tab")
        frame = self.tabview.tab("Dispersion")
        
        # Legend/Filters
        filter_frame = ctk.CTkFrame(frame, fg_color="transparent")
        filter_frame.pack(fill="x", pady=5, padx=10)
        
        for label, color in SEGMENT_COLORS.items():
            btn = ctk.CTkLabel(filter_frame, text=f" ● {label} ", text_color=color, font=ctk.CTkFont(size=10, weight="bold"))
            btn.pack(side="left", padx=5)

        # Plot
        fig, ax = plt.subplots(figsize=(8, 4), facecolor=COLORS["card"], dpi=100)
        ax.set_facecolor(COLORS["card"])
        
        # Plot data points
        for risk, color in SEGMENT_COLORS.items():
            sub = df[df['riesgo'] == risk]
            if not sub.empty:
                # Bubble size based on valor_rechazo
                sizes = np.clip(sub['valor_rechazo'] ** 0.55 * 0.18, 20, 500)
                ax.scatter(sub['cascos'], sub['tasa_pct'], s=sizes, c=color, alpha=0.7, edgecolors='white', linewidth=0.5, label=risk)

        # Average lines
        ax.axhline(y=self.avg_rate, color=COLORS["azul"], linestyle='--', alpha=0.5)
        ax.axvline(x=20, color=COLORS["naranja"], linestyle='--', alpha=0.5)
        
        # Styling
        ax.set_xlabel("Cascos producidos", color=COLORS["gris"])
        ax.set_ylabel("Tasa rechazo %", color=COLORS["gris"])
        ax.tick_params(colors=COLORS["gris"])
        for spine in ax.spines.values():
            spine.set_edgecolor(COLORS["borde"])
        ax.grid(True, linestyle='--', alpha=0.1)
        
        canvas = FigureCanvasTkAgg(fig, master=frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True)

    def setup_tramo_tab(self, df, summary_tramo):
        frame = self.tabview.tab("Por Tramo")
        
        # Create two columns
        col1 = ctk.CTkFrame(frame, fg_color="transparent")
        col1.pack(side="left", fill="both", expand=True, padx=(10, 5), pady=10)
        
        col2 = ctk.CTkFrame(frame, fg_color="transparent")
        col2.pack(side="right", fill="both", expand=True, padx=(5, 10), pady=10)

        # Bar chart in col1
        fig1, ax1 = plt.subplots(figsize=(5, 4), facecolor=COLORS["card"])
        ax1.set_facecolor(COLORS["card"])
        
        labels = [d['tramo'] for d in summary_tramo]
        values = [d['tasa_media'] for d in summary_tramo]
        colors = [TRAMO_COLORS.get(l, COLORS["azul"]) for l in labels]
        
        ax1.bar(labels, values, color=colors, alpha=0.8)
        ax1.axhline(y=self.avg_rate, color=COLORS["azul"], linestyle='--', alpha=0.5)
        ax1.set_title("Tasa Media por Tramo", color=COLORS["blanco"], pad=15)
        ax1.tick_params(axis='x', rotation=30, colors=COLORS["gris"])
        ax1.tick_params(axis='y', colors=COLORS["gris"])
        for spine in ax1.spines.values(): spine.set_edgecolor(COLORS["borde"])
        
        canvas1 = FigureCanvasTkAgg(fig1, master=col1)
        canvas1.draw()
        canvas1.get_tk_widget().pack(fill="both", expand=True)

        # Pie chart in col2
        fig2, ax2 = plt.subplots(figsize=(5, 4), facecolor=COLORS["card"])
        ax2.set_facecolor(COLORS["card"])
        
        pie_values = [d['valor_rechazo'] for d in summary_tramo]
        # Filter out 0 for pie
        final_values = []
        final_labels = []
        final_colors = []
        for i, v in enumerate(pie_values):
            if v > 0:
                final_values.append(v)
                final_labels.append(labels[i])
                final_colors.append(colors[i])

        if final_values:
            wedges, texts, autotexts = ax2.pie(final_values, labels=None, autopct='%1.1f%%', 
                                            colors=final_colors, startangle=140, pctdistance=0.85)
            # Draw circle for donut
            centre_circle = plt.Circle((0,0), 0.70, fc=COLORS["card"])
            fig2.gca().add_artist(centre_circle)
            
            for autotext in autotexts: autotext.set_color('white')
        
        ax2.set_title("Valor Rechazo por Tramo", color=COLORS["blanco"], pad=15)
        
        canvas2 = FigureCanvasTkAgg(fig2, master=col2)
        canvas2.draw()
        canvas2.get_tk_widget().pack(fill="both", expand=True)

    def setup_table_tab(self, df):
        frame = self.tabview.tab("Tabla de Datos")
        
        # Scrollable Frame for table
        table_frame = ctk.CTkScrollableFrame(frame, fg_color="transparent")
        table_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        headers = ["Referencia", "Familia", "Tramo", "Cascos", "Tasa %", "V. Rechazo"]
        header_widths = [180, 120, 150, 80, 80, 120]
        
        # Header Row
        for j, h in enumerate(headers):
            lbl = ctk.CTkLabel(table_frame, text=h.upper(), font=ctk.CTkFont(size=11, weight="bold"), 
                              text_color=COLORS["gris"], width=header_widths[j], anchor="w")
            lbl.grid(row=0, column=j, padx=5, pady=5)
            
        # Data Rows (Top 50 by valor_rechazo)
        top_data = df.sort_values('valor_rechazo', ascending=False).head(50)
        
        for i, row in enumerate(top_data.itertuples()):
            r_idx = i + 1
            
            ctk.CTkLabel(table_frame, text=row.articulo, font=ctk.CTkFont(weight="bold"), 
                        text_color=COLORS["blanco"], width=header_widths[0], anchor="w").grid(row=r_idx, column=0, padx=5, pady=2)
            
            ctk.CTkLabel(table_frame, text=row.familia, text_color=COLORS["gris"], width=header_widths[1], anchor="w").grid(row=r_idx, column=1, padx=5, pady=2)
            
            tram_col = TRAMO_COLORS.get(row.tramo, COLORS["azul"])
            ctk.CTkLabel(table_frame, text=row.tramo, text_color=tram_col, width=header_widths[2], anchor="w").grid(row=r_idx, column=2, padx=5, pady=2)
            
            ctk.CTkLabel(table_frame, text=f"{row.cascos}", text_color=COLORS["texto"], width=header_widths[3], anchor="w").grid(row=r_idx, column=3, padx=5, pady=2)
            
            tasa_col = COLORS["rojo"] if row.tasa_pct >= 50 else (COLORS["naranja"] if row.tasa_pct >= 25 else COLORS["texto"])
            ctk.CTkLabel(table_frame, text=f"{row.tasa_pct:.1f}%", text_color=tasa_col, font=ctk.CTkFont(weight="bold"), width=header_widths[4], anchor="w").grid(row=r_idx, column=4, padx=5, pady=2)
            
            ctk.CTkLabel(table_frame, text=f"{row.valor_rechazo:,.0f}€".replace(",", "."), text_color=COLORS["naranja"], width=header_widths[5], anchor="w").grid(row=r_idx, column=5, padx=5, pady=2)

    def clear_window(self):
        for widget in self.winfo_children():
            widget.destroy()

    def get_filtered_df(self):
        if not self.selected_families:
            return self.df
        return self.df[self.df['familia'].isin(self.selected_families)]

    def create_family_filters(self, parent):
        filter_frame = ctk.CTkFrame(parent, fg_color=COLORS["card"], border_color=COLORS["borde"], border_width=1)
        filter_frame.pack(fill="x", pady=(0, 15))

        title = ctk.CTkLabel(filter_frame, text="Filtrar por Familia:", 
                             font=ctk.CTkFont(size=11, weight="bold"), text_color=COLORS["gris"])
        title.pack(anchor="w", padx=12, pady=(8, 4))

        btn_frame = ctk.CTkFrame(filter_frame, fg_color="transparent")
        btn_frame.pack(fill="x", padx=8, pady=(0, 8))

        families = sorted(self.df['familia'].dropna().unique().tolist())
        for fam in families:
            is_active = fam in self.selected_families
            btn = ctk.CTkButton(
                btn_frame,
                text=fam,
                height=26,
                corner_radius=12,
                fg_color=COLORS["azul"] if is_active else COLORS["borde"],
                text_color=COLORS["blanco"] if is_active else COLORS["texto"],
                hover_color="#2060C0" if is_active else "#223348",
                command=lambda f=fam: self.toggle_family_filter(f)
            )
            btn.pack(side="left", padx=5, pady=4)

        if self.selected_families:
            clear_btn = ctk.CTkButton(
                btn_frame,
                text="Limpiar filtros",
                height=26,
                corner_radius=12,
                fg_color="transparent",
                text_color=COLORS["gris"],
                hover_color=COLORS["borde"],
                command=self.clear_family_filters
            )
            clear_btn.pack(side="left", padx=5, pady=4)

    def toggle_family_filter(self, family):
        if family in self.selected_families:
            self.selected_families.remove(family)
        else:
            self.selected_families.append(family)
        self.show_dashboard()

    def clear_family_filters(self):
        self.selected_families = []
        self.show_dashboard()

if __name__ == "__main__":
    app = App()
    app.mainloop()
