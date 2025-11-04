
import React, { useState, useMemo } from 'react';
import { Role, LogEntry, LogType, AlertType } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Header from './components/Header';
import GuardView from './components/GuardView';
import WardenView from './components/WardenView';

const LATE_ENTRY_HOUR = 22; // 10 PM
const EARLY_EXIT_HOUR = 6;  // 6 AM
const LOG_LIMIT = 50;

const App: React.FC = () => {
  const [role, setRole] = useLocalStorage<Role>('swift-pass-role', Role.GUARD);
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('swift-pass-logs', []);
  const [holidayMode, setHolidayMode] = useLocalStorage<boolean>('swift-pass-holiday-mode', false);

  const handleScan = (studentId: string, logType: LogType) => {
    const now = new Date();
    const currentHour = now.getHours();
    let alertType = AlertType.NONE;

    if (!holidayMode) {
      if (logType === LogType.ENTRY && currentHour >= LATE_ENTRY_HOUR) {
        alertType = AlertType.LATE_ENTRY;
      } else if (logType === LogType.EXIT && currentHour < EARLY_EXIT_HOUR) {
        alertType = AlertType.EARLY_EXIT;
      }
    }

    const newLog: LogEntry = {
      id: `${now.getTime()}-${studentId}`,
      studentId,
      logType,
      timestamp: now.toISOString(),
      alertType,
    };

    setLogs(prevLogs => [newLog, ...prevLogs]);
  };
  
  const unreturnedStudents = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const studentLastLog = new Map<string, LogEntry>();

    for (const log of logs) {
        if (new Date(log.timestamp) >= todayStart) {
            const existing = studentLastLog.get(log.studentId);
            if (!existing || new Date(log.timestamp) > new Date(existing.timestamp)) {
                studentLastLog.set(log.studentId, log);
            }
        }
    }

    const unreturned: string[] = [];
    const now = new Date();
    const isAfterReturnTime = now.getHours() >= LATE_ENTRY_HOUR;
    
    // Only check for unreturned students after the designated return time
    if (isAfterReturnTime || holidayMode) { // Also show if holiday mode is on to let warden know who's out
        studentLastLog.forEach((log, studentId) => {
            if (log.logType === 'EXIT') {
                unreturned.push(studentId);
            }
        });
    }

    return unreturned;
  }, [logs, holidayMode]);

  const visibleLogs = logs.slice(0, LOG_LIMIT);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header currentRole={role} onRoleChange={setRole} />
      <main>
        {role === Role.GUARD ? (
          <GuardView 
            logs={visibleLogs} 
            unreturnedStudents={unreturnedStudents}
            onScan={handleScan} 
          />
        ) : (
          <WardenView 
            logs={visibleLogs} 
            unreturnedStudents={unreturnedStudents}
            holidayMode={holidayMode}
            onToggleHolidayMode={() => setHolidayMode(prev => !prev)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
