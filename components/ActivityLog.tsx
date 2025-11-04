
import React from 'react';
import { LogEntry, LogType, AlertType } from '../types';
import { AlertTriangleIcon } from './Icons';

interface LogCardProps {
  log: LogEntry;
}

const LogCard: React.FC<LogCardProps> = ({ log }) => {
  const isEntry = log.logType === LogType.ENTRY;
  const isAlert = log.alertType !== AlertType.NONE;

  const baseClasses = "p-4 rounded-lg shadow-md mb-3 flex items-center justify-between transition-all duration-300 transform hover:scale-105";
  const colorClasses = isAlert 
    ? "bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500" 
    : isEntry
      ? "bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500"
      : "bg-orange-100 dark:bg-orange-900/50 border-l-4 border-orange-500";

  const getAlertMessage = (alertType: AlertType) => {
    switch(alertType) {
      case AlertType.LATE_ENTRY: return "Late Entry";
      case AlertType.EARLY_EXIT: return "Early Exit";
      default: return "";
    }
  };

  return (
    <div className={`${baseClasses} ${colorClasses}`}>
      <div>
        <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{log.studentId}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{new Date(log.timestamp).toLocaleString()}</p>
      </div>
      <div className="text-right">
        <p className={`font-semibold text-sm uppercase ${isEntry ? "text-green-700 dark:text-green-300" : "text-orange-700 dark:text-orange-300"}`}>{log.logType}</p>
        {isAlert && <p className="text-xs font-bold text-red-600 dark:text-red-400">{getAlertMessage(log.alertType)}</p>}
      </div>
    </div>
  );
};

interface ActivityLogProps {
  logs: LogEntry[];
  unreturnedStudents: string[];
}

const UnreturnedStudents: React.FC<{ studentIds: string[] }> = ({ studentIds }) => {
  if (studentIds.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400 flex items-center">
        <AlertTriangleIcon className="w-6 h-6 mr-2" />
        Unreturned Students
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studentIds.map(id => (
          <div key={id} className="bg-red-500 text-white p-4 rounded-lg shadow-lg text-center">
            <p className="font-bold text-xl">{id}</p>
            <p className="text-sm">Did not return by 10:00 PM</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityLog: React.FC<ActivityLogProps> = ({ logs, unreturnedStudents }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full">
      <UnreturnedStudents studentIds={unreturnedStudents} />
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Live Activity Feed</h2>
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        {logs.length > 0 ? (
          logs.map(log => <LogCard key={log.id} log={log} />)
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p>No activity yet.</p>
            <p className="text-sm">Scan a QR code to begin logging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
