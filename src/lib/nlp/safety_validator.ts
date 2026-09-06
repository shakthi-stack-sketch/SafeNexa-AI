/**
 * SAFENEXA — Safety Relevance Validation Engine
 *
 * Implements strict preliminary validation to verify whether an input text
 * represents a genuine Health, Safety & Environment (HSE) observation
 * before any SIF classification or precursor extraction is performed.
 */

export interface SafetyValidationResult {
  isValid: boolean;
  reason?: string;
  detectedConcepts: string[];
  relevanceScore: number; // 0.0 to 1.0
}

// 1. Definite Non-Safety / Out-of-Domain Signals
const OUT_OF_DOMAIN_PATTERNS: { regex: RegExp; label: string }[] = [
  // Academic / Coursework / Assignments
  { regex: /\b(dbms|sql\b.*select|assignment|homework|syllabus|semester|exam|quiz|grade|lecture|coursework|submission|submit\s+(my|the)?\s*(assignment|task|project|code|repo)|thesis|dissertation)\b/i, label: 'Academic / Coursework' },
  // Programming code / markup / scripts
  { regex: /<!doctype html>|<html|<script|<\/script>|<body|const\s+\w+\s*=|function\s*\w*\s*\(|console\.log|import\s+.*from/i, label: 'Source Code / Markup' },
  // Shopping / Groceries / Recipes
  { regex: /\b(shopping list|groceries|recipe|ingredients|teaspoon|tablespoon|bake at|supermarket)\b/i, label: 'Shopping / Cooking' },
  // General personal chat / banter / reminders without safety context
  { regex: /^(hi|hello|hey|what's up|how are you|good morning|test|asdf|12345|qwerty)[.!?\s]*$/i, label: 'Casual Greeting / Noise' },
  // Travel / Hotel / Flights without industrial context
  { regex: /\b(flight reservation|boarding pass|hotel booking|vacation itinerary|movie ticket)\b/i, label: 'Travel / Entertainment' },
];

// 2. Strong Safety / HSE Domain Terminology
const SAFETY_CORE_KEYWORDS = [
  // Core Incident & Observation Vocabulary
  'near miss', 'near-miss', 'unsafe act', 'unsafe condition', 'hazard', 'hazardous',
  'safety observation', 'incident', 'accident', 'injury', 'first aid', 'fatal', 'fatality',
  'loss of containment', 'spill', 'leak', 'fire', 'explosion', 'blast', 'flashed',
  'damage', 'dropped object', 'falling object', 'collapsed', 'collapse',

  // PPE & Personal Protection
  'ppe', 'safety harness', 'harness', 'lanyard', 'safety helmet', 'hard hat', 'safety glasses',
  'eye protection', 'ear plug', 'ear defender', 'coverall', 'safety boots', 'respirator',
  'scba', 'face shield', 'fall arrest', 'self-retracting lifeline', 'anchor point', 'tie-off',

  // High-Energy & Industrial Hazards
  'confined space', 'manway', 'vessel entry', 'atmospheric testing', 'gas test', 'gas detector',
  'toxic gas', 'h2s', 'hydrogen sulfide', 'oxygen deficient', 'asphyxiation', 'explosive atmosphere',
  'lel', 'lower explosive limit', 'flammable vapor', 'combustible gas',
  'hot work', 'welding', 'torch cutting', 'grinding sparks', 'fire watch',
  'working at height', 'scaffold', 'scaffolding', 'scafftag', 'toe board', 'guardrail', 'ladder',
  'energy isolation', 'lockout', 'tagout', 'loto', 'de-energiz', 'live line', 'residual pressure',
  'pressurized line', 'bleeder valve', 'flange leak', 'hydrotest', 'pipe rupture', 'blowout',
  'lifting operation', 'crane', 'rigging', 'sling', 'shackle', 'suspended load', 'tagline',
  'tag line', 'drop zone', 'exclusion zone', 'hoist', 'winch',
  'line of fire', 'pinch point', 'crush hazard', 'rotating equipment', 'nip point', 'machine guard',
  'whip check', 'whip-check', 'safety clamp',
  'heavy vehicle', 'tanker', 'bowser', 'speeding', 'seatbelt', 'rollover', 'reversing alarm',

  // Safety Governance, Controls & Barriers
  'permit to work', 'ptw', 'work authorization', 'work permit', 'job safety analysis', 'jsa',
  'toolbox talk', 'tbt', 'safety briefing', 'stop work authority', 'swa', 'stop work',
  'barrier failure', 'interlock', 'bypassed', 'trip bypassed', 'safety critical', 'scada alarm',
  'relief valve', 'psv', 'rupture disk', 'deluge', 'fire extinguisher', 'emergency shower',
  'eye wash', 'muster point', 'emergency shutdown', 'esd',

  // Low-Energy / Housekeeping / Routine Safety Deviations
  'housekeeping', 'trip hazard', 'slip hazard', 'cluttered walkway', 'blocked exit',
  'blocked egress', 'loose cable', 'trailing lead', 'missing signage', 'caution tape',
  'spill kit', 'improper storage', 'unlabeled container', 'pallet obstruction',
  'damaged ladder', 'expired inspection tag', 'poor lighting'
];

/**
 * Validates whether an input narrative represents a legitimate HSE/Safety observation.
 */
export function validateSafetyRelevance(text: string): SafetyValidationResult {
  const trimmed = (text || '').trim();

  // Basic length & character check
  if (!trimmed || trimmed.length < 15) {
    return {
      isValid: false,
      reason: 'The submitted text is too short to constitute an HSE or safety observation narrative.',
      detectedConcepts: [],
      relevanceScore: 0,
    };
  }

  const textLower = trimmed.toLowerCase();

  // Check for distinct out-of-domain patterns
  for (const ood of OUT_OF_DOMAIN_PATTERNS) {
    if (ood.regex.test(trimmed)) {
      // Check if there is genuine industrial safety context overriding this
      const matchingSafetyTerms = SAFETY_CORE_KEYWORDS.filter((kw) => textLower.includes(kw));
      if (matchingSafetyTerms.length === 0) {
        return {
          isValid: false,
          reason: 'The submitted content does not appear to describe an HSE or safety observation. Please upload a safety report, unsafe act, unsafe condition, near miss, or incident.',
          detectedConcepts: [ood.label],
          relevanceScore: 0,
        };
      }
    }
  }

  // Count safety concept hits
  const detectedConcepts: string[] = [];
  for (const kw of SAFETY_CORE_KEYWORDS) {
    if (textLower.includes(kw)) {
      if (!detectedConcepts.includes(kw)) {
        detectedConcepts.push(kw);
      }
    }
  }

  // Calculate relevance score
  // If at least one strong safety keyword is detected:
  if (detectedConcepts.length >= 1) {
    const relevanceScore = Math.min(1.0, 0.4 + detectedConcepts.length * 0.15);
    return {
      isValid: true,
      detectedConcepts,
      relevanceScore,
    };
  }

  // If no known safety keywords were matched, reject as non-safety content
  return {
    isValid: false,
    reason: 'The submitted content does not appear to describe an HSE or safety observation. Please upload a safety report, unsafe act, unsafe condition, near miss, or incident.',
    detectedConcepts: [],
    relevanceScore: 0.05,
  };
}
