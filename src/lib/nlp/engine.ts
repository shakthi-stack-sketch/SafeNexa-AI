import { Report, ReportType, SIFPotential, LifeSavingRule, CorrectiveAction, ModelThresholds } from '../types';
import { IOGP_RULES_CONFIG, ALL_LIFE_SAVING_RULES } from '../rules/iogp_rules';
import { validateSafetyRelevance } from './safety_validator';

export interface AnalysisInput {
  report_text: string;
  report_type: ReportType;
  site?: string;
  date?: string;
  activity?: string;
}

export interface AnalysisResult {
  report_id: string;
  sif_potential: SIFPotential;
  sif_score: number;
  activity: string;
  location: string;
  hazard: string;
  barrier_failure: string;
  life_saving_rule: LifeSavingRule;
  sif_precursor: string;
  explanation: string;
  evidence: string[];
  recommended_actions: CorrectiveAction;
}

export const DEFAULT_THRESHOLDS: ModelThresholds = {
  high: 0.75,
  medium: 0.45,
};

// Activity dictionaries
const ACTIVITY_PATTERNS: { regex: RegExp; name: string }[] = [
  { regex: /confined space|vessel entry|tank cleaning|sump clean/i, name: 'Vessel Entry & Internal Maintenance' },
  { regex: /scaffold|monkey board|derrick|working at height|ladder|roof|mast/i, name: 'Working at Elevation' },
  { regex: /welding|grinding|cutting|hot work|torch/i, name: 'Hot Work & Structural Repair' },
  { regex: /lifting|crane|hoist|rigging|sling|suspended load/i, name: 'Heavy Mechanical Lifting Operations' },
  { regex: /isolation|loto|lockout|tagout|valve maintenance|flange/i, name: 'Pressure System Energy Isolation' },
  { regex: /hydrotest|pressure test|bleeding line|pressurized/i, name: 'High-Pressure Line Testing' },
  { regex: /driving|truck|bowser|transit|vehicle/i, name: 'Field Transport & Driving' },
  { regex: /drilling|tripping\s+(in|out|pipe)|pipe\s+tripping|pipe racking|derrick floor/i, name: 'Rig Floor Tripping & Drilling Ops' },
  { regex: /electrical|cable|panel|substation|junction box/i, name: 'Electrical Panel Servicing' },
];

// Location dictionaries (Ground-truth sites, facilities, and physical plant zones)
const LOCATION_PATTERNS: { regex: RegExp; name: string }[] = [
  { regex: /\bmoran(\s+central)?(\s+tank\s+farm)?\b/i, name: 'Moran Tank Farm' },
  { regex: /\bnaharkatiya(\s+rig\s*(#?\d+)?)?\b/i, name: 'Naharkatiya Rig #4' },
  { regex: /\bduliajan(\s+cpf)?\b/i, name: 'Duliajan CPF' },
  { regex: /\bdigboi(\s+field(\s+area)?)?\b/i, name: 'Digboi Field Area' },
  { regex: /\btengakhat(\s+ocs)?\b/i, name: 'Tengakhat OCS' },
  { regex: /\bjorhat(\s+compressor(\s+station)?)?\b/i, name: 'Jorhat Compressor Station' },
  { regex: /\btank\s+farm\b/i, name: 'Central Crude Storage Tank Farm' },
  { regex: /\bcompressor\s+(station|house)\b/i, name: 'Gas Compressor House' },
  { regex: /\bdrilling\s+rig\b/i, name: 'Drilling Rig Site' },
  { regex: /\bpipe\s+rack\b/i, name: 'Elevated Pipe Rack Structure' },
  { regex: /\bwellhead\b/i, name: 'Wellhead Area' },
  { regex: /\bloading\s+(bay|gantry)\b/i, name: 'Tanker Loading Gantry' },
];

// High-consequence hazard markers
const HAZARD_PATTERNS: { regex: RegExp; hazard: string; baseScore: number; rule: LifeSavingRule }[] = [
  { regex: /toxic gas|h2s|hydrogen sulfide|asphyxiation|oxygen deficien|confined|entered.*vessel|inside.*(vessel|tank|separator)|vessel entry/i, hazard: 'Toxic Gas & Asphyxiation in Enclosed Space', baseScore: 0.88, rule: 'Confined Space' },
  { regex: /fall from|unguarded edge|no harness|without tie-off|fall arrest|at height/i, hazard: 'Unprotected Fall from Significant Height (>6m)', baseScore: 0.85, rule: 'Working at Height' },
  { regex: /high pressure|pressurized line|whip|blowout|stored pressure/i, hazard: 'High Pressure Stored Energy Line Rupture', baseScore: 0.82, rule: 'Energy Isolation' },
  { regex: /suspended load|sling failed|rigging snap|crane dropped|tagline missing/i, hazard: 'Catastrophic Suspended Load Failure / Dropped Object', baseScore: 0.84, rule: 'Safe Mechanical Lifting' },
  { regex: /flammable vapor|gas leak|explosion|sparks near gas|welding near crude/i, hazard: 'Hydrocarbon Ignition & Vapor Cloud Explosion', baseScore: 0.89, rule: 'Hot Work' },
  { regex: /line of fire|pinch point|struck by pipe|whip-check/i, hazard: 'High-Impact Line of Fire Impact / Crushing', baseScore: 0.78, rule: 'Line of Fire' },
  { regex: /interlock bypass|safety valve gagged|sensor disconnected|jumper wire|override/i, hazard: 'Defeat of Instrumented Safety Protective Barrier', baseScore: 0.86, rule: 'Bypassing Safety Controls' },
  { regex: /no permit|unauthorized entry|simops conflict|without ptw/i, hazard: 'Uncontrolled Execution Without Verified PTW Controls', baseScore: 0.74, rule: 'Work Authorisation' },
  { regex: /speeding|seatbelt|rollover|brake failure/i, hazard: 'Heavy Vehicle Collision / Loss of Directional Control', baseScore: 0.72, rule: 'Driving' },
];

// Barrier failure markers
const BARRIER_FAILURE_PATTERNS: { regex: RegExp; failure: string; penaltyScore: number }[] = [
  { regex: /without.*atmospheric.*testing|no gas detector|gas test not done|no atmospheric test|without.*gas test/i, failure: 'Atmospheric multi-gas testing was omitted prior to entry', penaltyScore: 0.35 },
  { regex: /without (safety )?harness|no lanyard|harness not anchored|unhooked harness|without.*tie-off/i, failure: 'Fall arrest equipment was not anchored or tethered', penaltyScore: 0.32 },
  { regex: /not isolated|no loto|lockout not applied|lockout tagout.*not applied|loto.*not applied|bleeder valve closed|residual pressure/i, failure: 'Positive energy isolation and zero-energy verification missing', penaltyScore: 0.33 },
  { regex: /no fire watch|fire extinguisher absent|hot work permit not signed/i, failure: 'Mandatory fire watch and continuous LEL monitoring absent', penaltyScore: 0.30 },
  { regex: /no tagline|tag line not used|under suspended load|walked under/i, failure: 'Personnel stood within drop zone without tag line guidance', penaltyScore: 0.30 },
  { regex: /no permit|without ptw|permit expired|no job safety analysis|no tbt/i, failure: 'Task initiated without authorized Permit to Work and TBT briefing', penaltyScore: 0.25 },
  { regex: /interlock bypassed|bypassed trip|jumper wire|jumper installed|override.*interlock/i, failure: 'Safety instrumented interlock bypassed without formal authorization', penaltyScore: 0.34 },
  { regex: /scaffold tag missing|red tag|loose plank|no toe board/i, failure: 'Scaffolding used without authorized inspection scafftag verification', penaltyScore: 0.26 },
  { regex: /whip.?check.*missing|whip.?check not installed|without whip.?check/i, failure: 'Safety retention whip-check not secured on high-pressure air/liquid line', penaltyScore: 0.28 },
];

export function analyzeReport(input: AnalysisInput, thresholds: ModelThresholds = DEFAULT_THRESHOLDS): AnalysisResult {
  const text = input.report_text || '';
  const textLower = text.toLowerCase();

  // 1. Mandatory Safety / HSE Relevance Validation Check
  const validation = validateSafetyRelevance(text);
  if (!validation.isValid) {
    throw new Error(
      validation.reason ||
      'The submitted content does not appear to describe an HSE or safety observation. Please upload a safety report, unsafe act, unsafe condition, near miss, or incident.'
    );
  }

  // 2. Extract Activity (from input or grounded narrative regex, never fabricate)
  let detectedActivity = input.activity?.trim() || '';
  if (!detectedActivity) {
    for (const act of ACTIVITY_PATTERNS) {
      if (act.regex.test(textLower)) {
        detectedActivity = act.name;
        break;
      }
    }
    if (!detectedActivity) {
      detectedActivity = 'Not identified in the report';
    }
  }

  // 3. Extract Location (from grounded text match or optional site metadata)
  let detectedLocation = '';
  for (const loc of LOCATION_PATTERNS) {
    if (loc.regex.test(textLower)) {
      detectedLocation = loc.name;
      break;
    }
  }
  if (!detectedLocation) {
    detectedLocation = input.site?.trim() ? input.site.trim() : 'Not identified in the report';
  }

  // 4. Match Life-Saving Rule & Hazard (Only if genuinely supported by text)
  let matchedRule: LifeSavingRule = 'None';
  let primaryHazard = 'Not identified in the report';
  let baseConfidence = 0.15;
  let hasExplicitHazard = false;
  const evidenceSpans: string[] = [];

  // Evaluate explicit high-energy hazards
  for (const hp of HAZARD_PATTERNS) {
    const match = text.match(hp.regex);
    if (match) {
      matchedRule = hp.rule;
      primaryHazard = hp.hazard;
      baseConfidence = Math.max(baseConfidence, hp.baseScore);
      hasExplicitHazard = true;
      if (!evidenceSpans.includes(match[0])) {
        evidenceSpans.push(match[0]);
      }
    }
  }

  // Evaluate rule keywords for secondary match only if explicit hazard not found
  let maxKeywordHits = 0;
  for (const rule of ALL_LIFE_SAVING_RULES) {
    const meta = IOGP_RULES_CONFIG[rule];
    let hits = 0;
    for (const signal of meta.keySignals) {
      if (textLower.includes(signal.toLowerCase())) {
        hits++;
        if (!evidenceSpans.includes(signal)) {
          evidenceSpans.push(signal);
        }
      }
    }
    if (hits > maxKeywordHits && !hasExplicitHazard && hits >= 2) {
      maxKeywordHits = hits;
      matchedRule = rule;
      baseConfidence = Math.min(0.60, 0.30 + hits * 0.08);
      primaryHazard = `Potential hazard exposure under ${rule}`;
    }
  }

  // 5. Detect Barrier Failure & SIF Precursor
  let detectedBarrierFailure = 'Not identified in the report';
  let precursorIdentified = 'Routine operational observation with low energy concentration';
  let penalty = 0;

  for (const bf of BARRIER_FAILURE_PATTERNS) {
    const match = text.match(bf.regex);
    if (match) {
      detectedBarrierFailure = bf.failure;
      precursorIdentified = `Unmitigated exposure due to: ${bf.failure.toLowerCase()}`;
      penalty = Math.max(penalty, bf.penaltyScore);
      if (!evidenceSpans.includes(match[0])) {
        evidenceSpans.push(match[0]);
      }
    }
  }

  // If no high hazard and no barrier defeat, mark as routine low-risk observation
  if (!hasExplicitHazard && penalty === 0 && maxKeywordHits === 0) {
    detectedBarrierFailure = 'No critical safety barrier defeat identified';
    precursorIdentified = 'Routine operational observation with low energy concentration';
    if (primaryHazard === 'Not identified in the report') {
      primaryHazard = 'Low-consequence hazard / Routine observation';
    }
    baseConfidence = 0.12;
  }

  // 6. Compute SIF Score (0.0 to 0.99)
  let rawScore = baseConfidence + (penalty * 0.4);
  if (hasExplicitHazard || penalty > 0) {
    if (input.report_type === 'Incident') rawScore += 0.08;
    if (input.report_type === 'Near Miss') rawScore += 0.05;
    if (input.report_type === 'UA' && penalty > 0.25) rawScore += 0.04;
  } else {
    rawScore = Math.min(0.28, baseConfidence + (input.report_type === 'Incident' ? 0.06 : 0.02));
  }

  // Bound score cleanly
  const sif_score = Math.min(0.97, Math.max(0.12, Math.round(rawScore * 100) / 100));

  // Determine SIF Potential
  let sif_potential: SIFPotential = 'LOW';
  if (sif_score >= thresholds.high) {
    sif_potential = 'HIGH';
  } else if (sif_score >= thresholds.medium) {
    sif_potential = 'MEDIUM';
  } else if (sif_score < 0.25 && !hasExplicitHazard && penalty === 0) {
    sif_potential = 'NON-SIF';
  } else {
    sif_potential = 'LOW';
  }

  // If high SIF but precursor was generic, synthesize clear precursor
  if (sif_potential === 'HIGH' && precursorIdentified.includes('Routine operational')) {
    precursorIdentified = matchedRule !== 'None'
      ? `${matchedRule} barrier absent or compromised during ${detectedActivity}`
      : `High-risk precursor condition identified during ${detectedActivity}`;
  }

  // 7. Build Human-Readable Explanation
  const explanationPoints: string[] = [];
  if (sif_potential === 'HIGH') {
    if (matchedRule !== 'None') {
      explanationPoints.push(`High-potential energy exposure identified under the IOGP Life-Saving Rule '${matchedRule}'.`);
    } else {
      explanationPoints.push('High-potential energy exposure identified in report narrative.');
    }
    if (detectedBarrierFailure !== 'Not identified in the report') {
      explanationPoints.push(`Critical safety barrier was compromised: ${detectedBarrierFailure.toLowerCase()}.`);
    }
    if (primaryHazard !== 'Not identified in the report') {
      explanationPoints.push(`Direct exposure to hazard: ${primaryHazard}.`);
    }
    explanationPoints.push('Without an active independent safeguard, this event possessed credible potential for fatal or life-altering consequence.');
  } else if (sif_potential === 'MEDIUM') {
    if (matchedRule !== 'None') {
      explanationPoints.push(`Identified deviation involves '${matchedRule}'${detectedActivity !== 'Not identified in the report' ? ` within ${detectedActivity}` : ''}.`);
    }
    if (detectedBarrierFailure !== 'Not identified in the report') {
      explanationPoints.push(`Barrier deficiency observed: ${detectedBarrierFailure.toLowerCase()}.`);
    }
    explanationPoints.push('While immediate fatality potential was partially mitigated by secondary controls, repeat occurrence escalates SIF vulnerability.');
  } else if (sif_potential === 'NON-SIF') {
    explanationPoints.push('Valid safety report with no serious injury or fatality (SIF) potential.');
    explanationPoints.push('Observation involves routine operational conditions without exposure to uncontrolled high-consequence energy.');
    explanationPoints.push('No life-critical safety barrier defeat identified.');
  } else {
    explanationPoints.push('Routine operational deviation with lower energy concentration.');
    explanationPoints.push('No direct failure of a life-critical safety barrier identified.');
    explanationPoints.push('Remediation involves local housekeeping and standard procedural reinforcement.');
  }

  const explanation = explanationPoints.join(' ');

  // 8. Grounded Corrective Actions
  let recommended_actions: CorrectiveAction;
  if (sif_potential === 'HIGH' || sif_potential === 'MEDIUM') {
    recommended_actions = {
      immediate: [
        detectedActivity !== 'Not identified in the report'
          ? `Execute Stop Work Authority (SWA) immediately on ${detectedActivity.toLowerCase()} until site is made safe.`
          : 'Execute Stop Work Authority (SWA) immediately on the task until site is made safe.',
        detectedLocation !== 'Not identified in the report'
          ? `Quarantine the immediate hazard perimeter at ${detectedLocation}.`
          : 'Quarantine the immediate hazard perimeter at the work location.',
      ],
      control: [
        detectedBarrierFailure !== 'Not identified in the report'
          ? `Reinstate the compromised barrier: ${detectedBarrierFailure.toLowerCase()}.`
          : 'Reinstate required physical barriers and safeguards.',
        matchedRule !== 'None'
          ? `Verify physical verification of '${matchedRule}' control requirements before lifting work hold.`
          : 'Verify physical verification of safety control requirements before lifting work hold.',
      ],
      verification: [
        'Require HSE Area Supervisor to physically inspect and sign off on site readiness checklist.',
        'Perform calibrated instrument testing and continuous surveillance during active work.',
      ],
      preventive: [
        matchedRule !== 'None'
          ? `Conduct a focused Safety Stand-down and review with the involved operating crew on '${matchedRule}'.`
          : 'Conduct a focused Safety Stand-down and review with the involved operating crew.',
        'Audit similar ongoing tasks across the asset to identify identical barrier failures.',
      ],
    };
  } else {
    recommended_actions = {
      immediate: [
        'Address immediate low-energy condition (e.g. area housekeeping or tool stowage).',
      ],
      control: [
        'Verify standard procedural housekeeping in work area.',
      ],
      verification: [
        'Local supervisor visual confirmation of tidy and unobstructed work area.',
      ],
      preventive: [
        'Reinforce routine 5S housekeeping during daily toolbox briefing (TBT).',
      ],
    };
  }

  // Generate Report ID
  const report_id = `R-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    report_id,
    sif_potential,
    sif_score,
    activity: detectedActivity,
    location: detectedLocation,
    hazard: primaryHazard,
    barrier_failure: detectedBarrierFailure,
    life_saving_rule: matchedRule,
    sif_precursor: precursorIdentified,
    explanation,
    evidence: evidenceSpans.slice(0, 5),
    recommended_actions,
  };
}
