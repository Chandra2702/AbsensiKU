import React, { useRef, useState, useEffect } from 'react';
import { exportData, importData, clearAllData, getServerUrl, setServerUrl } from '../services/storage';
import { Download, Upload, Trash2, Database, AlertTriangle, FileJson, Server, Save } from 'lucide-react';

interface SettingsProps {
  onDataImported: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onDataImported }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [serverUrlInput, setServerUrlInput] = useState('');

  useEffect(() => {
    setServerUrlInput(getServerUrl());
  }, []);

  const handleSaveUrl = () => {
    setServerUrl(serverUrlInput);
    alert("URL Server berhasil disimpan. Aplikasi akan mencoba sinkronisasi otomatis.");
    onDataImported(); // Trigger reload to pull data
  };

  const handleDownload = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_absensi_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (window.confirm("Apakah Anda yakin ingin mengganti data saat ini dengan data dari file backup? Data saat ini akan ditimpa.")) {
          const success = importData(content);
          if (success) {
            alert("Data berhasil dipulihkan!");
            onDataImported();
          } else {
            alert("Gagal membaca file backup. Pastikan format file benar (.json).");
          }
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm("PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data siswa dan absensi? Tindakan ini tidak dapat dibatalkan.")) {
      clearAllData();
      alert("Semua data telah dihapus.");
      onDataImported();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pengaturan Data</h2>
        <p className="text-gray-500">Kelola sinkronisasi server, backup, dan pemulihan.</p>
      </div>

      {/* Server Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
             <Server size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Koneksi Server Utama</h3>
            <p className="text-sm text-gray-500">
              Hubungkan aplikasi ke hosting Anda untuk sinkronisasi data real-time antar guru.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Endpoint Server (API)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={serverUrlInput}
                onChange={(e) => setServerUrlInput(e.target.value)}
                placeholder="https://website-sekolah.com/api/absensi.php"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <button 
                onClick={handleSaveUrl}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                Simpan
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Pastikan URL mengarah ke file backend yang bisa menerima GET (baca) dan POST (tulis) JSON.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs font-mono text-gray-600 mb-2">Contoh Script PHP Sederhana (simpan sebagai absensi.php di hosting):</p>
            <pre className="text-[10px] sm:text-xs bg-gray-800 text-gray-200 p-3 rounded overflow-x-auto">
{`<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$file = 'database_absensi.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = file_get_contents('php://input');
    file_put_contents($file, $data);
    echo json_encode(["status" => "success"]);
} else {
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode(["students" => [], "attendance" => []]);
    }
}
?>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Backup/Restore */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
             <Database size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Backup & Restore Manual</h3>
            <p className="text-sm text-gray-500">
              Simpan data lokal sebagai file untuk cadangan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 p-6 border-2 border-slate-100 rounded-xl hover:border-primary/50 hover:bg-slate-50 transition-all group"
          >
            <div className="bg-success/10 text-success p-3 rounded-full group-hover:bg-success group-hover:text-white transition-colors">
              <Download size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-800">Download Backup</h4>
              <p className="text-xs text-gray-500 mt-1">Simpan data ke file (.json)</p>
            </div>
          </button>

          <button 
            onClick={handleUploadClick}
            className="flex items-center justify-center gap-3 p-6 border-2 border-slate-100 rounded-xl hover:border-primary/50 hover:bg-slate-50 transition-all group"
          >
            <div className="bg-info/10 text-info p-3 rounded-full group-hover:bg-info group-hover:text-white transition-colors">
              <Upload size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-800">Restore Backup</h4>
              <p className="text-xs text-gray-500 mt-1">Upload file (.json)</p>
            </div>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
        <div className="flex items-center gap-3 mb-4 text-danger">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-bold">Zona Bahaya</h3>
        </div>
        <p className="text-sm text-red-700 mb-6">
          Menghapus data akan menghilangkan seluruh daftar siswa dan riwayat absensi secara permanen dari browser ini (dan server jika terhubung).
        </p>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-200 text-danger rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all font-medium shadow-sm"
        >
          <Trash2 size={18} />
          Hapus Semua Data
        </button>
      </div>
    </div>
  );
};

export default Settings;