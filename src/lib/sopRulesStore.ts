import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirestoreQuotaExhausted, isQuotaExhaustedError, tripFirestoreQuotaCircuitBreaker } from './firebase';
import { SOPRulesPackage } from '../types';
import { INITIAL_SOP_RULES } from '../data/canonicalSOPRules';

const SOP_RULES_STORAGE_KEY = 'brickos_nashville_sop_rules_v1';
const SOP_SETTINGS_COLLECTION = 'studio_settings';
const SOP_RULES_DOC_ID = 'nashville_sop_rules';

export function getLocalCachedSOPRules(): SOPRulesPackage {
  try {
    const raw = localStorage.getItem(SOP_RULES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.rawMarkdown) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading cached SOP rules:', e);
  }
  return INITIAL_SOP_RULES;
}

export function setLocalCachedSOPRules(rules: SOPRulesPackage): void {
  try {
    localStorage.setItem(SOP_RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch (e) {
    console.warn('Error caching SOP rules locally:', e);
  }
}

export async function loadSOPRulesFromCloud(): Promise<SOPRulesPackage> {
  const localCached = getLocalCachedSOPRules();

  if (!db || isFirestoreQuotaExhausted()) {
    return localCached;
  }

  try {
    const docRef = doc(db, SOP_SETTINGS_COLLECTION, SOP_RULES_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const cloudData = snap.data() as SOPRulesPackage;
      if (cloudData && cloudData.rawMarkdown) {
        setLocalCachedSOPRules(cloudData);
        return cloudData;
      }
    } else if (!isFirestoreQuotaExhausted()) {
      // Seed initial rules to Firestore if quota is available
      try {
        await setDoc(docRef, { ...INITIAL_SOP_RULES, _schemaVersion: 2 });
      } catch (err: any) {
        if (isQuotaExhaustedError(err)) {
          tripFirestoreQuotaCircuitBreaker(err.message);
        }
      }
      setLocalCachedSOPRules(INITIAL_SOP_RULES);
      return INITIAL_SOP_RULES;
    }
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) {
      tripFirestoreQuotaCircuitBreaker(e.message);
    }
    console.warn('Failed to load SOP rules from Firestore, using local fallback:', e?.message || e);
  }

  return localCached;
}

export async function saveSOPRulesToCloud(rules: SOPRulesPackage): Promise<void> {
  setLocalCachedSOPRules(rules);

  if (!db || isFirestoreQuotaExhausted()) return;

  try {
    const docRef = doc(db, SOP_SETTINGS_COLLECTION, SOP_RULES_DOC_ID);
    await setDoc(docRef, {
      ...rules,
      _schemaVersion: 2,
      updatedAt: new Date().toISOString()
    });
  } catch (e: any) {
    if (isQuotaExhaustedError(e)) {
      tripFirestoreQuotaCircuitBreaker(e.message);
      return;
    }
    console.warn('Failed to persist SOP rules to Firestore (safely cached locally):', e?.message || e);
  }
}
