'use client';

interface LoadingOverlayGeneralProps {
    progress: number;
    isVisible: boolean;
}

/**
 * General loading overlay with progress bar
 * White background with gray progress bar
 */
export function LoadingOverlayGeneral({ progress, isVisible }: LoadingOverlayGeneralProps) {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const percentage = Math.round(clampedProgress * 100);

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center bg-white transition-opacity duration-500"
            style={{
                zIndex: 10000,
                opacity: isVisible ? 1 : 0,
                visibility: isVisible ? 'visible' : 'hidden',
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
        >
            <div className="text-center px-6">
                <p className="text-xs uppercase tracking-[0.4em] text-gray-500 mb-6">
                    Menyiapkan undangan
                </p>
                <div className="w-64 max-w-[70vw] h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                        className="h-full bg-gray-800 transition-all duration-300 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-600">{percentage}%</p>
                <p className="mt-1 text-xs text-gray-400">Memuat foto, musik, dan animasi</p>
            </div>
        </div>
    );
}
