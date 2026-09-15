// Exportación a CSV desde el panel — leads y suscriptores salen del sistema
// sin depender de un developer ni de acceso a la base. Es la salida que pide
// cualquier equipo comercial: abrir la bandeja en Excel/Sheets y trabajarla.
//
// Sin dependencias: el formato CSV que necesitamos es RFC 4180 básico y
// escribirlo bien son diez líneas. Se emite con BOM UTF-8 porque Excel en
// Windows —el escenario real de esta empresa— interpreta un CSV sin BOM como
// ANSI y rompe todos los acentos.

const BOM = '﻿';

/** Escapa un valor: comillas dobladas y entrecomillado si hay coma, comilla o salto. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => unknown;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => cell(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => cell(c.value(r))).join(','));
  return BOM + [head, ...body].join('\r\n');
}

/** Dispara la descarga en el navegador y libera el object URL. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Fecha legible para el nombre del archivo: leads-2026-08-09.csv */
export function stamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
