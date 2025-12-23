#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Extract Zeichnungskopf data from Excel files based on Zeichnungsnummer.
Searches for matching row and maps columns to Zeichnungskopf fields.
"""

import sys
import json
import os
import pandas as pd
from pathlib import Path

# Mapping: Zeichnungskopf field -> list of possible column names (case-insensitive)
FIELD_MAPPINGS = {
    'CAD System': ['cad system', 'konstruktionssoftware', 'designprogramm', 'zeichnungssoftware', 'cad programm', 'cad-system', 'cad_system'],
    'Abteilung': ['abteilung', 'department', 'bereich', 'fachbereich', 'fachgruppe', 'dept'],
    'Name Zeichnungsverantwortlicher': ['name of drawing manager', 'name zeichnungsverantwortlicher', 'verantwortlicher', 'ansprechpartner', 'betreuer', 'zuständiger', 'bauteileverantwortlicher', 'btv', 'ersteller', 'bearbeiter', 'author'],
    'Telefonnummer Zeichnungsverantwortlicher': ['telephone number of drawing manager', 'telefonnummer zeichnungsverantwortlicher', 'telefonnummer', 'rufnummer', 'kontakt', 'tel.', 'tel', 'ansprechpartner-telefon', 'phone', 'telefon'],
    'Projekt': ['projekt', 'project', 'vorhaben', 'initiative', 'auftrag', 'projektname', 'project name'],
    'Werkstoff': ['werkstoff', 'material', 'rohstoff', 'substanz', 'materials', 'mat'],
    'Gewicht': ['gewicht', 'weight', 'masse', 'eigengewicht', 'mass', 'wt'],
    'Halbzeug': ['halbzeug', 'semi-finished product', 'rohteil', 'vormaterial', 'zwischenprodukt', 'semi finished'],
    'Format Zeichnungsblatt': ['format zeichnungsblatt', 'drawing sheet format', 'blattgröße', 'papierformat', 'format', 'zeichnungsgröße', 'sheet format', 'blattformat'],
    'Oberflächenschutz': ['oberflächenschutz', 'surface protection', 'beschichtung', 'korrosionsschutz', 'oberflächenbehandlung', 'coating', 'surface'],
    'Blattnummer': ['blattnummer', 'sheet number', 'seitenzahl', 'blattkennzeichnung', 'zeichnungsblattnummer', 'blatt nr', 'sheet no'],
    'Blattanzahl': ['blattanzahl', 'number of sheets', 'gesamtseiten', 'anzahl der blätter', 'seitenumfang', 'total sheets', 'sheets'],
    'Benennung': ['benennung', 'designation', 'bezeichnung', 'titel', 'nomenklatur', 'description', 'name', 'title', 'beschreibung'],
    'Teilenummer': ['teilenummer', 'part number', 'artikelnummer', 'komponentenkennzeichen', 'identifikationsnummer', 'partnumber', 'part no', 'pn', 'sachnummer', 'zeichnungsnummer'],
    'Maßstab': ['maßstab', 'scale', 'skalierung', 'verhältnis', 'proportionen', 'massstab']
}

# Possible column names for identifying the row by Zeichnungsnummer
ZEICHNUNGSNUMMER_COLUMNS = [
    'zeichnungsnummer', 'drawing number', 'part number', 'partnumber', 'part no', 
    'teilenummer', 'artikelnummer', 'sachnummer', 'nummer', 'number', 'id',
    'bauteilnummer', 'component number', 'pn', 'article', 'artikelnr'
]


def normalize_column_name(col):
    """Normalize column name for comparison."""
    if pd.isna(col):
        return ''
    return str(col).lower().strip().replace('_', ' ').replace('-', ' ')


def find_matching_column(df_columns, possible_names):
    """Find the first matching column from a list of possible names."""
    normalized_cols = {normalize_column_name(c): c for c in df_columns}
    for name in possible_names:
        normalized_name = normalize_column_name(name)
        if normalized_name in normalized_cols:
            return normalized_cols[normalized_name]
        # Partial match
        for norm_col, orig_col in normalized_cols.items():
            if normalized_name in norm_col or norm_col in normalized_name:
                return orig_col
    return None


def find_row_by_zeichnungsnummer(df, zeichnungsnummer):
    """Find the row that contains the Zeichnungsnummer."""
    if not zeichnungsnummer:
        return None
    
    zeichnungsnummer_lower = zeichnungsnummer.lower().strip()
    
    # First, try to find the Zeichnungsnummer column
    zn_col = find_matching_column(df.columns, ZEICHNUNGSNUMMER_COLUMNS)
    
    if zn_col:
        # Search in the identified column
        for idx, val in df[zn_col].items():
            if pd.notna(val) and zeichnungsnummer_lower in str(val).lower():
                return idx
    
    # If not found, search in all columns
    for idx, row in df.iterrows():
        for val in row.values:
            if pd.notna(val) and zeichnungsnummer_lower in str(val).lower():
                return idx
    
    return None


def extract_from_excel(file_path, zeichnungsnummer):
    """Extract Zeichnungskopf data from an Excel file."""
    result = {field: '' for field in FIELD_MAPPINGS.keys()}
    debug_info = {}
    
    try:
        # Read all sheets
        excel_file = pd.ExcelFile(file_path)
        
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            
            if df.empty:
                continue
            
            # Find the row with the Zeichnungsnummer
            row_idx = find_row_by_zeichnungsnummer(df, zeichnungsnummer)
            
            if row_idx is not None:
                row_data = df.loc[row_idx]
                
                # Extract data for each field
                for field, possible_names in FIELD_MAPPINGS.items():
                    if result[field]:  # Skip if already found
                        continue
                    
                    col = find_matching_column(df.columns, possible_names)
                    if col and pd.notna(row_data.get(col)):
                        value = str(row_data[col])
                        result[field] = value
                        debug_info[field] = f"Sheet: {sheet_name}, Column: {col}"
        
        return {
            'success': True,
            'data': result,
            'debug': debug_info
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'data': result
        }


def extract_from_uploads(uploads_dir, zeichnungsnummer):
    """Extract data from all Excel files in the uploads directory."""
    result = {field: '' for field in FIELD_MAPPINGS.keys()}
    all_debug = {}
    files_processed = []
    
    uploads_path = Path(uploads_dir)
    
    if not uploads_path.exists():
        return {
            'success': False,
            'error': f'Uploads directory not found: {uploads_dir}',
            'data': result
        }
    
    # Find all Excel files
    excel_files = list(uploads_path.glob('*.xlsx')) + list(uploads_path.glob('*.xls'))
    
    for excel_file in excel_files:
        files_processed.append(str(excel_file.name))
        extraction = extract_from_excel(str(excel_file), zeichnungsnummer)
        
        if extraction['success']:
            # Merge results (don't overwrite non-empty values)
            for field, value in extraction['data'].items():
                if value and not result[field]:
                    result[field] = value
                    if field in extraction.get('debug', {}):
                        all_debug[field] = f"{excel_file.name}: {extraction['debug'][field]}"
    
    return {
        'success': True,
        'data': result,
        'debug': all_debug,
        'files_processed': files_processed
    }


if __name__ == '__main__':
    # Set stdout encoding to UTF-8 for Windows compatibility
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    # Usage: python extract_from_excel.py <uploads_dir> <zeichnungsnummer>
    if len(sys.argv) < 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python extract_from_excel.py <uploads_dir> <zeichnungsnummer>'
        }))
        sys.exit(1)
    
    uploads_dir = sys.argv[1]
    zeichnungsnummer = sys.argv[2]
    
    result = extract_from_uploads(uploads_dir, zeichnungsnummer)
    print(json.dumps(result, ensure_ascii=False, indent=2))
