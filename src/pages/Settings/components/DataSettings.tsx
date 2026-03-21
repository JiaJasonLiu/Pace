import React, { useRef } from 'react';
import { AppState, Transaction } from '../../../types';
import Papa from 'papaparse';
import { Download, Upload } from 'lucide-react';
import { DataSettingsProps } from '../types';

export function DataSettings({ state, onImport }: DataSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    if (state.transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }

    const csv = Papa.unparse(state.transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `royal_budget_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const importedTransactions: Transaction[] = results.data.map((row: any) => {
            if (!row.amount || !row.type) throw new Error("Invalid CSV format");
            
            return {
              id: row.id || crypto.randomUUID(),
              date: row.date || new Date().toISOString(),
              amount: Number(row.amount),
              type: row.type as 'income' | 'expense',
              category: row.category || 'Imported',
              description: row.description || 'Imported transaction'
            };
          });

          onImport({ transactions: [...state.transactions, ...importedTransactions] });
          alert(`Successfully imported ${importedTransactions.length} transactions.`);
        } catch (error) {
          console.error("Import error:", error);
          alert("Failed to import CSV. Please ensure it matches the export format.");
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-medium mb-2">Data Management</h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Export your data to analyze it in Excel or Google Sheets, or import data from a CSV file.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleExportCSV}
          className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-royal/10 text-royal rounded-full flex items-center justify-center mr-4">
              <Download className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-slate-800">Export to CSV</h3>
              <p className="text-xs text-slate-500">Download your transaction history</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mr-4">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-slate-800">Import CSV</h3>
              <p className="text-xs text-slate-500">Add transactions from a file</p>
            </div>
          </div>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImportCSV}
          />
        </button>
      </div>
    </div>
  );
}
