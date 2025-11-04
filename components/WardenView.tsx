
import React, { useState } from 'react';
import { LogEntry } from '../types';
import ActivityLog from './ActivityLog';
import { DownloadIcon, QrCodeIcon, SpreadsheetIcon } from './Icons';

interface QrGeneratorProps { }

const QrGenerator: React.FC<QrGeneratorProps> = () => {
  const [studentId, setStudentId] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qrCodeUrl = studentId 
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(studentId)}&size=200x200&format=png` 
    : '';
  
  const handleDownload = async () => {
    if (!qrCodeUrl || isDownloading) return;
    setIsDownloading(true);
    setError(null);
    try {
      const response = await fetch(qrCodeUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${studentId}_qr_code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code:', err);
      setError('Could not download QR code. Please check your network connection and try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center"><QrCodeIcon className="w-6 h-6 mr-2" /> QR Code Generator</h3>
      <input
        type="text"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        placeholder="Enter Student Name or ID"
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
      />
      {qrCodeUrl && (
        <div className="mt-4 flex flex-col items-center text-center">
          <img src={qrCodeUrl} alt="Generated QR Code" className="border-4 border-gray-200 dark:border-gray-600 rounded-lg"/>
          <p className="mt-2 font-semibold text-gray-700 dark:text-gray-300 break-all">{studentId}</p>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="mt-4 bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors flex items-center disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="w-5 h-5 mr-2"/>
            {isDownloading ? 'Downloading...' : 'Download QR'}
          </button>
        </div>
      )}
       {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  );
};

interface WardenViewProps {
  logs: LogEntry[];
  unreturnedStudents: string[];
  holidayMode: boolean;
  onToggleHolidayMode: () => void;
}

const WardenView: React.FC<WardenViewProps> = ({ logs, unreturnedStudents, holidayMode, onToggleHolidayMode }) => {
  const exportToCsv = (data: LogEntry[], filename: string) => {
    const headers = "Student ID,Action,Timestamp,Alert Type\n";
    const csvContent = data.map(log => 
      `${log.studentId},${log.logType},${new Date(log.timestamp).toLocaleString()},${log.alertType}`
    ).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysLogs = logs.filter(log => new Date(log.timestamp) >= today);
    exportToCsv(todaysLogs, `hostel_logs_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportWeek = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weeksLogs = logs.filter(log => new Date(log.timestamp) >= weekAgo);
    exportToCsv(weeksLogs, `hostel_logs_last_7_days.csv`);
  };


  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Controls</h3>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 dark:text-gray-200">Holiday Mode</span>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={holidayMode} onChange={onToggleHolidayMode} className="sr-only peer" />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">When enabled, late entry/early exit alerts are disabled.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center"><SpreadsheetIcon className="w-6 h-6 mr-2" /> Export Records</h3>
          <div className="space-y-3">
             <button onClick={handleExportToday} className="w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Export Today's Logs</button>
             <button onClick={handleExportWeek} className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Export Last 7 Days</button>
          </div>
        </div>
        
        <QrGenerator />
      </div>

      <div className="lg:col-span-2">
        <ActivityLog logs={logs} unreturnedStudents={unreturnedStudents} />
      </div>
    </div>
  );
};

export default WardenView;
