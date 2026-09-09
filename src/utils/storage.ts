import { InspectionRecord } from '../types';
import { DEMO_SCENARIOS } from '../data/demoScenarios';
import { runComplianceScreening } from './complianceEngine';

const STORAGE_KEY = 'lm_inspections_history_v1';

// Seed initial history if empty
export function initializeStorage(): InspectionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read inspections from localStorage', e);
  }

  // Pre-populate with two realistic initial records so history is immediately rich for demonstration
  const initialRecords: InspectionRecord[] = [
    runComplianceScreening(
      DEMO_SCENARIOS[0].declarations,
      DEMO_SCENARIOS[0].previewImage,
      'LM-2026-1042',
      true
    ),
    runComplianceScreening(
      DEMO_SCENARIOS[1].declarations,
      DEMO_SCENARIOS[1].previewImage,
      'LM-2026-1039',
      true
    )
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRecords));
  } catch (e) {
    console.warn('Could not seed initial inspections', e);
  }

  return initialRecords;
}

export function getSavedInspections(): InspectionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initializeStorage();
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to get saved inspections', e);
    return [];
  }
}

export function saveInspection(record: InspectionRecord): InspectionRecord[] {
  try {
    const current = getSavedInspections();
    // Prepend new record, update existing if ID matches
    const filtered = current.filter((item) => item.id !== record.id);
    const updated = [record, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save inspection to storage', e);
    return [];
  }
}

export function deleteInspection(id: string): InspectionRecord[] {
  try {
    const current = getSavedInspections();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete inspection', e);
    return [];
  }
}

export function clearAllInspections(): InspectionRecord[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch (e) {
    console.error('Failed to clear inspections', e);
    return [];
  }
}
