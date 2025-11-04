import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LogType, LogEntry } from '../types';
import ActivityLog from './ActivityLog';
import { SwitchCameraIcon } from './Icons';

declare const Html5Qrcode: any;

const ManualEntryForm: React.FC<{ logMode: LogType; onSubmit: (studentId: string) => void; }> = ({ logMode, onSubmit }) => {
  const [studentId, setStudentId] = useState('');
  const isEntry = logMode === LogType.ENTRY;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim()) {
      onSubmit(studentId.trim());
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">Manual Log</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Enter Student ID"
          autoFocus
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className={`mt-4 w-full text-white font-bold py-3 rounded-lg transition-colors ${
            isEntry ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          Log {logMode}
        </button>
      </form>
    </div>
  );
};


interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  scanMode: LogType;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScanSuccess, scanMode }) => {
  const scannerRef = useRef<any>(null);
  const readerId = "qr-reader";
  
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState<number>(0);
  const [zoomCapabilities, setZoomCapabilities] = useState<{ min: number; max: number; step: number; } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        try {
            await scannerRef.current.stop();
        } catch (err) {
            console.warn("Failed to stop scanner cleanly. This is expected if the state changes quickly.", err);
        }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Initialize scanner instance when modal opens for the first time
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerId);
      }
      
      setShowManualEntry(false);
      Html5Qrcode.getCameras()
        .then((devices: any[]) => {
          if (devices && devices.length) {
            setCameras(devices);
            const environmentCameraIndex = devices.findIndex(d => 
              d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
            );
            setActiveCameraIndex(environmentCameraIndex !== -1 ? environmentCameraIndex : 0);
          } else {
            setError("No cameras found on this device.");
          }
        })
        .catch((err: any) => {
          if (err?.name === 'NotAllowedError') {
              setError("Camera permission denied. Please allow camera access in your browser settings and refresh.");
          } else {
              setError("Could not access camera. Please ensure it's not being used by another application.");
          }
        });
    } else {
      stopScanner().then(() => {
          setCameras([]);
          setZoomCapabilities(null);
          setCurrentZoom(1);
          setError(null);
      });
    }
  }, [isOpen, stopScanner]);

  useEffect(() => {
    const startScanner = async () => {
        if (!isOpen || cameras.length === 0 || showManualEntry || !scannerRef.current) {
            return;
        }

        const html5QrCode = scannerRef.current;
        const cameraId = cameras[activeCameraIndex].id;
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        try {
            // The cleanup function from the previous effect run will handle stopping.
            // No need to call stopScanner() here, as it creates race conditions.
            await html5QrCode.start(
                cameraId,
                config,
                onScanSuccess,
                () => { /* ignore */ }
            );

            const capabilities = html5QrCode.getRunningTrackCapabilities();
            const zoomCaps = capabilities?.zoom;
            if (zoomCaps) {
                setZoomCapabilities({ min: zoomCaps.min, max: zoomCaps.max, step: zoomCaps.step });
                const settings = html5QrCode.getRunningTrackSettings();
                setCurrentZoom(settings.zoom || zoomCaps.min);
            } else {
                setZoomCapabilities(null);
            }
            setError(null);
        } catch (err) {
            let message = "Failed to start scanner. ";
            if (cameras.length > 1) {
                message += "The camera may be in use by another app. Try switching cameras.";
            } else {
                message += "Please check camera permissions and ensure it's not in use elsewhere.";
            }
            setError(message);
            setZoomCapabilities(null);
        }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, activeCameraIndex, cameras, onScanSuccess, showManualEntry, stopScanner]);

  const handleSwitchCamera = () => {
    setActiveCameraIndex(prevIndex => (prevIndex + 1) % cameras.length);
  };
  
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zoomValue = parseFloat(e.target.value);
    setCurrentZoom(zoomValue);
    if (scannerRef.current?.isScanning) {
        scannerRef.current.applyVideoConstraints({
            advanced: [{ zoom: zoomValue }]
        }).catch((err: any) => {
            console.warn("Zoom failed to apply", err);
        });
    }
  };

  const handleManualEntryClick = () => {
    stopScanner();
    setShowManualEntry(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-2xl w-full max-w-md relative">
        {showManualEntry ? (
           <ManualEntryForm logMode={scanMode} onSubmit={onScanSuccess} />
        ) : (
          <>
            <h2 className={`text-2xl font-bold mb-4 text-center ${scanMode === LogType.ENTRY ? 'text-green-500' : 'text-red-500'}`}>
              Scanning for {scanMode}
            </h2>

            <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden">
              <div id={readerId} className="w-full h-full"></div>
              {error && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white p-6 text-center font-semibold rounded-lg">{error}</div>}
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex flex-col gap-4">
                  {zoomCapabilities && (
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-sm font-medium text-white">Zoom</span>
                      <input
                        type="range"
                        min={zoomCapabilities.min}
                        max={zoomCapabilities.max}
                        step={zoomCapabilities.step}
                        value={currentZoom}
                        onChange={handleZoomChange}
                        className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer backdrop-blur-sm"
                      />
                    </div>
                  )}
                  {cameras.length > 0 && (
                     <div className="flex items-center justify-center">
                      <button
                        onClick={handleSwitchCamera}
                        title="Switch Camera"
                        aria-label="Switch Camera"
                        disabled={cameras.length <= 1}
                        className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors disabled:bg-white/10 disabled:text-white/50 disabled:cursor-not-allowed"
                      >
                        <SwitchCameraIcon className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
                onClick={handleManualEntryClick}
                className="mt-4 w-full text-center text-sm text-indigo-500 dark:text-indigo-400 hover:underline"
              >
                Can't scan? Enter ID manually.
            </button>
          </>
        )}
        
        <button
          onClick={onClose}
          className="mt-2 w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};


interface GuardViewProps {
  logs: LogEntry[];
  unreturnedStudents: string[];
  onScan: (studentId: string, logType: LogType) => void;
}

const GuardView: React.FC<GuardViewProps> = ({ logs, unreturnedStudents, onScan }) => {
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<LogType>(LogType.ENTRY);

  const handleOpenScanner = (mode: LogType) => {
    setScanMode(mode);
    setScannerOpen(true);
  };

  const handleCloseScanner = () => {
    setScannerOpen(false);
  };

  const handleScanSuccess = (studentId: string) => {
    onScan(studentId, scanMode);
    handleCloseScanner();
  };
  
  const buttonBaseClasses = "w-full text-white font-bold py-12 md:py-20 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300 flex flex-col items-center justify-center text-3xl md:text-4xl";

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-8">
        <button 
          onClick={() => handleOpenScanner(LogType.ENTRY)}
          className={`${buttonBaseClasses} bg-green-500 hover:bg-green-600`}
        >
          <span>ENTRY</span>
          <span className="text-lg mt-2">Scan QR Code</span>
        </button>
        <button 
          onClick={() => handleOpenScanner(LogType.EXIT)}
          className={`${buttonBaseClasses} bg-red-500 hover:bg-red-600`}
        >
          <span>EXIT</span>
          <span className="text-lg mt-2">Scan QR Code</span>
        </button>
      </div>

      <ActivityLog logs={logs} unreturnedStudents={unreturnedStudents} />

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={handleCloseScanner}
        onScanSuccess={handleScanSuccess}
        scanMode={scanMode}
      />
    </div>
  );
};

export default GuardView;