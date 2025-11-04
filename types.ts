
export enum Role {
  GUARD = 'GUARD',
  WARDEN = 'WARDEN',
}

export enum LogType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

export enum AlertType {
  LATE_ENTRY = 'LATE_ENTRY',
  EARLY_EXIT = 'EARLY_EXIT',
  NONE = 'NONE',
}

export interface LogEntry {
  id: string;
  studentId: string;
  logType: LogType;
  timestamp: string;
  alertType: AlertType;
}
