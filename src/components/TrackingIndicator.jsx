// src/components/TrackingIndicator.jsx
import { useStepTrackerContext } from '../context/StepTrackerContext'

export default function TrackingIndicator() {
  const { isTracking, stappen } = useStepTrackerContext()

  // Niets tonen als tracking niet actief is
  if (!isTracking) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div className="flex items-center gap-2 bg-[#84cc16]/90 text-[#0a0a0a] text-xs font-bold px-3 py-2 rounded-full shadow-lg backdrop-blur-sm">
        <span className="w-2 h-2 rounded-full bg-[#0a0a0a] animate-ping" />
        <span>{stappen} stappen live</span>
      </div>
    </div>
  )
}