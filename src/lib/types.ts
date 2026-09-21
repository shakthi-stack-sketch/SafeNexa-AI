export type ReportType = 'UA' | 'UC' | 'Near Miss' | 'Incident' | 'Unsafe Act' | 'Unsafe Condition';

export type SIFPotential = 'HIGH' | 'MEDIUM' | 'LOW' | 'NON-SIF';

export type LifeSavingRule =
  | 'Bypassing Safety Controls'
  | 'Confined Space'
  | 'Driving'
  | 'Energy Isolation'
  | 'Hot Work'
  | 'Line of Fire'
  | 'Safe Mechanical Lifting'
  | 'Work Authorisation'
  | 'Working at Height'
  | 'None';

export type ReviewStatus = 'Pending Review' | 'Reviewed' | 'Escalated' | 'Corrected';

export interface CorrectiveAction {
  immediate: string[];
  control: string[];
  verification: string[];
  preventive: string[];
}

export interface Report {
  id: string;
  report_text: string;
  report_type: ReportType;
  site: string;
  date: string;
  activity: string;
  location: string;
  hazard: string;
  barrier_failure: string;
  sif_potential: SIFPotential;
  sif_score: number; // 0.0 to 1.0
  life_saving_rule: LifeSavingRule;
  sif_precursor: string;
  explanation: string;
  evidence: string[]; // key phrases flagged from text
  recommended_actions: CorrectiveAction;
  review_status: ReviewStatus;
  reviewer_comment?: string;
  corrected_sif_potential?: SIFPotential;
  is_demo?: boolean;
  source?: 'manual' | 'computer_vision' | 'sensor';
  observation_type?: string;
  acknowledged_at?: string;
  escalated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PrecursorPattern {
  id: string;
  pattern_name: string;
  activity: string;
  location: string;
  barrier_failure: string;
  frequency: number;
  sif_count: number;
  sif_density: number; // sif_count / frequency (0.0 to 1.0)
  trend: 'up' | 'down' | 'stable';
  associated_hazard: string;
  life_saving_rule: LifeSavingRule;
  representative_report_ids: string[];
  recommended_intervention: string;
  is_demo?: boolean;
  created_at: string;
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface HSEAlert {
  id: string;
  severity: AlertSeverity;
  trigger: string;
  report_id?: string;
  site: string;
  activity: string;
  precursor: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  is_demo?: boolean;
  source?: 'manual' | 'computer_vision' | 'sensor';
  required_action?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  escalated_at?: string;
  escalated_to?: string;
  created_at: string;
  resolved_at?: string;
  assigned_to?: string;
}

export interface VisionBoundingBox {
  label: string;
  box: [number, number, number, number]; // [x, y, width, height] normalized (0 to 1) or px
  confidence: number;
  is_violation: boolean;
  color: string;
}

export interface VisionDetectionResult {
  timestamp: string;
  person_detected: boolean;
  helmet_detected: boolean;
  no_helmet_detected: boolean;
  vest_detected: boolean;
  confidence: number;
  fps: number;
  risk_level: AlertSeverity;
  bounding_boxes: VisionBoundingBox[];
  summary: string;
}

export interface AutomatedObservationPayload {
  source: 'computer_vision';
  observation_type: 'PPE_VIOLATION' | 'UNSAFE_ACT' | 'UNSAFE_CONDITION';
  description: string;
  risk_level: AlertSeverity;
  location: string;
  timestamp: string;
  auto_escalate_seconds?: number;
}

export interface HSEFeedback {
  id: string;
  report_id: string;
  ai_prediction: {
    sif_potential: SIFPotential;
    sif_score: number;
    life_saving_rule: LifeSavingRule;
    sif_precursor: string;
    barrier_failure: string;
  };
  hse_correction: {
    sif_potential: SIFPotential;
    life_saving_rule: LifeSavingRule;
    sif_precursor: string;
    barrier_failure: string;
  };
  reviewer_comment: string;
  reviewer_name: string;
  created_at: string;
}

export interface ModelThresholds {
  high: number;
  medium: number;
}

export interface BatchIngestSummary {
  totalUploaded: number;
  processed: number;
  highSif: number;
  mediumSif: number;
  lowSif: number;
  failed: number;
  reports: Report[];
}

export type UserRole = 'HSE Officer' | 'HSE Manager' | 'Administrator' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: UserRole;
  password_hash: string;
  salt: string;
  created_at: string;
  last_login?: string;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: UserRole;
  created_at: string;
}

export interface AuthSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  organization: string;
  exp: number;
}

