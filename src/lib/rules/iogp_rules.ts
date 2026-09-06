import { LifeSavingRule } from '../types';

export interface IOGPRuleMeta {
  rule: LifeSavingRule;
  code: string;
  description: string;
  keySignals: string[];
  standardControls: string[];
}

export const IOGP_RULES_CONFIG: Record<LifeSavingRule, IOGPRuleMeta> = {
  'Bypassing Safety Controls': {
    rule: 'Bypassing Safety Controls',
    code: 'LSR-01',
    description: 'Obtain authorization before overriding or disabling safety controls, interlocks, or safety critical equipment.',
    keySignals: [
      'bypass', 'bypassed', 'override', 'disabled', 'jumper', 'tampered',
      'interlock', 'defeat', 'safety critical', 'disconnected sensor', 'alarm inhibited'
    ],
    standardControls: [
      'Validate bypass risk assessment and permit authorization',
      'Log temporary override in Safety Critical Element (SCE) register',
      'Implement continuous manned supervision during bypass window',
      'Restore and re-test instrumented protective function prior to commissioning'
    ]
  },
  'Confined Space': {
    rule: 'Confined Space',
    code: 'LSR-02',
    description: 'Obtain authorization before entering a confined space. Verify isolation, gas testing, and standby man.',
    keySignals: [
      'confined space', 'vessel', 'tank', 'enclosed', 'manhole', 'separator',
      'sump', 'cellar', 'atmospheric test', 'gas detector', 'oxygen', 'h2s', 'standby'
    ],
    standardControls: [
      'Calibrated atmospheric multi-gas testing (O2, LEL, H2S, CO) before entry',
      'Positive mechanical and electrical energy isolation (spade / blind / LOTO)',
      'Continuous forced ventilation and dedicated external rescue standby personnel',
      'Valid Confined Space Entry Permit with active sign-in/out log'
    ]
  },
  'Driving': {
    rule: 'Driving',
    code: 'LSR-03',
    description: 'Follow safe driving rules: seatbelts, speed limits, no mobile phones, journey management.',
    keySignals: [
      'vehicle', 'truck', 'bowser', 'driving', 'seatbelt', 'speeding',
      'mobile phone while driving', 'journey management', 'driver fatigue', 'rollover'
    ],
    standardControls: [
      'Pre-trip vehicle inspection checklist and IVMS (In-Vehicle Monitoring) compliance',
      'Strict 100% seatbelt usage and zero mobile device policy while vehicle is in motion',
      'Approved Journey Management Plan (JMP) for field transits',
      'Defensive driving certification for all heavy equipment and rig haulage drivers'
    ]
  },
  'Energy Isolation': {
    rule: 'Energy Isolation',
    code: 'LSR-04',
    description: 'Verify isolation and zero energy before work begins. Lock, tag, test, and try.',
    keySignals: [
      'isolation', 'loto', 'lockout', 'tagout', 'live circuit', 'pressurized line',
      'zero energy', 'depressurize', 'bleeder valve', 'electrical isolation', 'residual pressure'
    ],
    standardControls: [
      'Positive physical isolation (spade / spectacle blind / double block and bleed)',
      'Individual padlock and danger tag application by every exposed craft',
      'Zero-energy state verification (zero electrical voltage test, vent pressure bleed)',
      'Isolation Certificate cross-referenced with PTW'
    ]
  },
  'Hot Work': {
    rule: 'Hot Work',
    code: 'LSR-05',
    description: 'Control flammables and ignition sources. Obtain hot work authorization and verify continuous gas testing.',
    keySignals: [
      'hot work', 'welding', 'grinding', 'torch', 'cutting', 'sparks',
      'flammable', 'gas leak', 'fire watch', 'hydrocarbon area', 'explosive atmosphere'
    ],
    standardControls: [
      'Continuous combustible gas monitor (LEL < 1%) within 15m radius of hot work',
      'Removal or shielding of all combustible/hydrocarbon sources with fire blankets',
      'Dedicated Fire Watch with fully charged extinguisher on site for 60 min post-work',
      'Approved Hot Work Permit Level 1 or 2 with site HSE endorsement'
    ]
  },
  'Line of Fire': {
    rule: 'Line of Fire',
    code: 'LSR-06',
    description: 'Keep yourself and others out of the line of fire: stored energy, falling objects, moving machinery, tension.',
    keySignals: [
      'line of fire', 'pinch point', 'suspended load', 'stored energy', 'struck by',
      'caught between', 'crushed', 'whip check', 'pressure test barricade', 'rotating shaft'
    ],
    standardControls: [
      'Establish physical exclusion zones and red-zone barricades around high-pressure lines',
      'Install whip-checks and safety retention clamps on all temporary pressure hoses',
      'Position technicians clear of swing radiuses, winch cables, and heavy counterweights',
      'Ensure machine safety guards are securely interlocked over moving rotating drives'
    ]
  },
  'Safe Mechanical Lifting': {
    rule: 'Safe Mechanical Lifting',
    code: 'LSR-07',
    description: 'Plan lifting operations and control the area. Never walk or stand under a suspended load.',
    keySignals: [
      'crane', 'lift', 'lifting', 'hoist', 'rigging', 'sling', 'shackle',
      'suspended load', 'derrick', 'winch', 'tagline', 'overload', 'rigger'
    ],
    standardControls: [
      'Certified lift plan with calculated crane radius and load chart verification',
      'Inspected, color-coded, third-party certified rigging hardware and web slings',
      '100% barricaded exclusion drop-zone; non-essential personnel restricted',
      'Use of non-conductive taglines to guide load without placing hands on suspended object'
    ]
  },
  'Work Authorisation': {
    rule: 'Work Authorisation',
    code: 'LSR-08',
    description: 'Work with a valid permit when required. Confirm all controls are in place before starting work.',
    keySignals: [
      'permit', 'ptw', 'work authorization', 'toolbox talk', 'tbt', 'simops',
      'unauthorized work', 'jsa', 'job safety analysis', 'risk assessment missing'
    ],
    standardControls: [
      'Valid, signed Permit-to-Work matched to task scope and authorized personnel',
      'Mandatory pre-job Toolbox Talk (TBT) communicating specific hazards and stop-work criteria',
      'Formal SIMOPS (Simultaneous Operations) matrix sign-off between affected teams',
      'Empowerment of all workers with Stop Work Authority (SWA) without fear of reprisal'
    ]
  },
  'Working at Height': {
    rule: 'Working at Height',
    code: 'LSR-09',
    description: 'Protect yourself against a fall from height. Inspect and use fall protection equipment properly.',
    keySignals: [
      'height', 'fall', 'scaffold', 'ladder', 'harness', 'lanyard', 'derrick mast',
      'monkey board', 'unguarded edge', 'anchor point', 'toe board', 'fall arrest'
    ],
    standardControls: [
      '100% tie-off with dual-lanyard full-body harness to engineered certified anchor point (>22kN)',
      'Complete scaffold tag inspection (Green Scafftag) with full handrails, midrails, and toeboards',
      'Tool tethering and safety lanyards for all elevated hand tools to prevent dropped objects',
      'Restricting ladder usage strictly to access, not prolonged working platforms'
    ]
  },
  'None': {
    rule: 'None',
    code: 'LSR-00',
    description: 'No specific IOGP Life-Saving Rule breach identified for this observation.',
    keySignals: [],
    standardControls: [
      'Maintain standard operating procedures and general situational awareness',
      'Adhere to site housekeeping and workplace ergonomics standards'
    ]
  }
};

export const ALL_LIFE_SAVING_RULES: LifeSavingRule[] = Object.keys(IOGP_RULES_CONFIG) as LifeSavingRule[];
