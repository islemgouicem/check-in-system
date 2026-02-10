import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

interface ScannerOverlayProps {
    onScan: (data: string) => void;
    onClose: () => void;
}

const ScannerOverlay = ({ onScan, onClose }: ScannerOverlayProps) => {
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scannerId = "reader";

        const startScanner = async () => {
            try {
                const scanner = new Html5Qrcode(scannerId);
                scannerRef.current = scanner;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                };

                await scanner.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        onScan(decodedText);
                        stopScanner();
                    },
                    (errorMessage) => {
                        // ignore frame parse errors
                        console.log(errorMessage);
                    }
                );
                setScanning(true);
            } catch (err: any) {
                console.error("Error starting scanner", err);
                if (err?.name === 'NotAllowedError' || err?.message?.includes('permission')) {
                    setError("Camera access denied. Please allow camera permissions in your browser settings.");
                } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    setError("Camera requires HTTPS or Localhost.");
                } else {
                    setError("Failed to start camera. " + (err?.message || ""));
                }
            }
        };

        // Small delay to ensure DOM is ready and component mounted
        const timer = setTimeout(() => {
            startScanner();
        }, 300);

        return () => {
            clearTimeout(timer);
            stopScanner();
        };
    }, [onScan]);

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.warn("Failed to stop scanner", err);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#080808]/95 backdrop-blur-sm text-white flex flex-col items-center justify-center font-['Futura']">
            <div className="w-full max-w-md bg-[#121212] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl relative mx-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-[#2A2A2A] shrink-0">
                    <h2 className="text-lg font-medium text-white flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary-400" />
                        Scan QR Code
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-0 bg-black flex-1 flex items-center justify-center relative min-h-[300px]">
                    {!error && !scanning && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                            <div className="animate-pulse flex flex-col items-center">
                                <Camera className="w-8 h-8 mb-2 opacity-50" />
                                <span className="text-sm">Starting Camera...</span>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className="p-8 text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Camera Error</h3>
                            <p className="text-gray-400 text-sm mb-4">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-sm hover:bg-[#2A2A2A]"
                            >
                                Close Scanner
                            </button>
                        </div>
                    ) : (
                        <div id="reader" className="w-full h-full overflow-hidden"></div>
                    )}
                </div>

                <div className="p-4 text-center border-t border-[#2A2A2A] shrink-0">
                    <p className="text-sm text-gray-400">
                        Point camera at a guest's QR code
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScannerOverlay;
