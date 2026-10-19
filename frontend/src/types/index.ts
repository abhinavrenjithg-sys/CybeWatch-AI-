export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'benign';
export type AlertStatus = 'new' | 'triaged' | 'investigating' | 'resolved' | 'false_positive';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface FeatureContribution {
  feature: string;
  raw_value: number;
  contribution: number;
  direction: 'positive' | 'negative';
}

export interface Prediction {
  id?: string;
  predicted_category: string;
  is_threat: boolean;
  threat_score: number;
  severity: Severity;
  latency_ms: number;
  class_probabilities?: Record<string, number>;
  feature_contributions?: FeatureContribution[];
  model_version?: string;
  created_at?: string;
}

export interface SecurityEvent {
  id: string;
  workspace_id: string;
  event_timestamp: string;
  source_ip: string;
  destination_ip: string;
  source_port?: number;
  destination_port?: number;
  protocol: string;
  service?: string;
  duration: number;
  src_bytes: number;
  dst_bytes: number;
  src_pkts: number;
  dst_pkts: number;
  sload: number;
  dload: number;
  sttl: number;
  dttl: number;
  loss_rate: number;
  is_synthetic: boolean;
  ingestion_source: string;
  created_at: string;
  prediction?: Prediction;
}

export interface InvestigationNote {
  id: string;
  alert_id?: string;
  incident_id?: string;
  author_id?: string;
  author_name?: string;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
}

export interface Alert {
  id: string;
  workspace_id: string;
  event_id: string;
  title: string;
  category: string;
  severity: Severity;
  threat_score: number;
  status: AlertStatus;
  assigned_to_id?: string;
  assigned_user_name?: string;
  model_version?: string;
  summary?: string;
  mitre_technique?: string;
  created_at: string;
  updated_at: string;
  event?: SecurityEvent;
  notes?: InvestigationNote[];
}

export interface Incident {
  id: string;
  workspace_id: string;
  incident_number: string;
  title: string;
  description?: string;
  status: IncidentStatus;
  severity: Severity;
  lead_source_ip?: string;
  target_destination_ip?: string;
  correlation_rule: string;
  ai_investigation_summary?: string;
  alert_count: number;
  alerts?: Alert[];
  created_at: string;
  updated_at: string;
}

export interface SeverityCount {
  severity: string;
  count: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  percentage: number;
}

export interface VolumeTimePoint {
  timestamp: string;
  total_events: number;
  threat_events: number;
}

export interface DashboardAnalytics {
  total_events_processed: number;
  threats_detected: number;
  active_alerts: number;
  open_incidents: number;
  benign_ratio: number;
  threat_ratio: number;
  pipeline_health: string;
  avg_latency_ms: number;
  severity_breakdown: SeverityCount[];
  category_breakdown: CategoryCount[];
  volume_timeline: VolumeTimePoint[];
}

export interface AIInvestigationResponse {
  target_id: string;
  target_type: string;
  summary: string;
  observed_evidence: string[];
  attack_hypotheses: Array<{
    hypothesis: string;
    likelihood: string;
    basis: string;
    mitre_id: string;
  }>;
  recommended_actions: Array<{
    step: string;
    description: string;
    requires_human_approval: string;
  }>;
  missing_telemetry: string[];
  confidence_statement: string;
  generated_at: string;
  provider: string;
}

export interface ModelEvaluationData {
  model_name: string;
  model_version: string;
  algorithm: string;
  dataset_name: string;
  total_test_samples: number;
  classes: string[];
  overall_metrics: {
    accuracy: number;
    precision_weighted: number;
    recall_weighted: number;
    f1_weighted: number;
    f1_macro: number;
    roc_auc_weighted: number;
    benign_fpr: number;
    avg_latency_ms: number;
  };
  per_class_metrics: Record<string, {
    precision: number;
    recall: number;
    f1_score: number;
    support: number;
  }>;
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
  };
  feature_importances: Array<{
    feature: string;
    importance: number;
  }>;
  candidate_comparison: Record<string, {
    name: string;
    accuracy: number;
    f1_weighted: number;
  }>;
  known_limitations: string[];
  evaluated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
