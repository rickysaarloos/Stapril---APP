// src/hooks/useStepTracker.js
import { useStepTrackerContext } from '../context/StepTrackerContext'

/**
 * Wrapper voor backward compatibility.
 * Haalt data op uit de globale StepTrackerContext in plaats van lokale state.
 * 
 * @param {string} uid - Wordt genegeerd (komt nu uit de Provider)
 * @returns {Object} { stappen, status, startTracking, stopTracking, resetStappen, pct, isTracking }
 */
export function useStepTracker(uid) {
  // `uid` parameter wordt genegeerd omdat de Provider in ProtectedRoute deze al levert
  // Dit zorgt dat bestaande code blijft werken zonder wijzigingen
  return useStepTrackerContext()
}