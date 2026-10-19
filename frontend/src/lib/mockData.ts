import {
  SecurityEvent,
  Alert,
  Incident,
  DashboardAnalytics,
  ModelEvaluationData,
  AuditLog
} from '../types';

export const INITIAL_ANALYTICS: DashboardAnalytics = {
  total_events_processed: 20032,
  threats_detected: 7979,
  active_alerts: 26,
  open_incidents: 7,
  benign_ratio: 60.2,
  threat_ratio: 39.8,
  pipeline_health: "HEALTHY",
  avg_latency_ms: 0.05,
  severity_breakdown: [
    { severity: "benign", count: 12053 },
    { severity: "critical", count: 3379 },
    { severity: "high", count: 4011 },
    { severity: "medium", count: 589 },
    { severity: "low", count: 0 }
  ],
  category_breakdown: [
    { category: "Benign", count: 12053, percentage: 60.2 },
    { category: "DoS", count: 2396, percentage: 12.0 },
    { category: "PortScan", count: 1954, percentage: 9.8 },
    { category: "BruteForce", count: 1615, percentage: 8.1 },
    { category: "Exploits", count: 999, percentage: 5.0 },
    { category: "Botnet", count: 983, percentage: 4.9 }
  ],
  volume_timeline: [
    { timestamp: "18:00", total_events: 120, threat_events: 42 },
    { timestamp: "18:05", total_events: 185, threat_events: 68 },
    { timestamp: "18:10", total_events: 210, threat_events: 95 },
    { timestamp: "18:15", total_events: 340, threat_events: 145 },
    { timestamp: "18:20", total_events: 280, threat_events: 110 },
    { timestamp: "18:25", total_events: 310, threat_events: 130 }
  ]
};

export const INITIAL_EVENTS: SecurityEvent[] = [
  {
    id: "ev-101",
    workspace_id: "soc-primary",
    event_timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    source_ip: "185.220.101.5",
    destination_ip: "10.0.0.5",
    source_port: 49122,
    destination_port: 22,
    protocol: "tcp",
    service: "ssh",
    duration: 2.54,
    src_bytes: 4500,
    dst_bytes: 2200,
    src_pkts: 50,
    dst_pkts: 35,
    sload: 14173.2,
    dload: 6929.1,
    sttl: 55,
    dttl: 64,
    loss_rate: 0.01,
    is_synthetic: true,
    ingestion_source: "simulator_stream",
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    prediction: {
      predicted_category: "BruteForce",
      is_threat: true,
      threat_score: 0.9997,
      severity: "high",
      latency_ms: 0.052,
      model_version: "v1.0.0-xgb",
      feature_contributions: [
        { feature: "service_ssh", raw_value: 1.0, contribution: 0.1955, direction: "positive" },
        { feature: "duration", raw_value: 1.178, contribution: 0.0523, direction: "positive" },
        { feature: "destination_port", raw_value: -0.411, contribution: -0.0242, direction: "negative" }
      ]
    }
  },
  {
    id: "ev-102",
    workspace_id: "soc-primary",
    event_timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    source_ip: "198.51.100.23",
    destination_ip: "10.0.0.2",
    source_port: 52104,
    destination_port: 80,
    protocol: "tcp",
    service: "http",
    duration: 0.035,
    src_bytes: 28000,
    dst_bytes: 80,
    src_pkts: 650,
    dst_pkts: 2,
    sload: 6400000.0,
    dload: 18285.7,
    sttl: 48,
    dttl: 0,
    loss_rate: 0.42,
    is_synthetic: true,
    ingestion_source: "simulator_stream",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    prediction: {
      predicted_category: "DoS",
      is_threat: true,
      threat_score: 1.0,
      severity: "high",
      latency_ms: 0.048,
      model_version: "v1.0.0-xgb",
      feature_contributions: [
        { feature: "sload", raw_value: 6.8, contribution: 0.284, direction: "positive" },
        { feature: "src_pkts", raw_value: 3.4, contribution: 0.198, direction: "positive" }
      ]
    }
  },
  {
    id: "ev-103",
    workspace_id: "soc-primary",
    event_timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    source_ip: "45.33.32.156",
    destination_ip: "192.168.1.45",
    source_port: 41290,
    destination_port: 1433,
    protocol: "tcp",
    service: "-",
    duration: 0.0015,
    src_bytes: 44,
    dst_bytes: 0,
    src_pkts: 1,
    dst_pkts: 0,
    sload: 234666.0,
    dload: 0.0,
    sttl: 52,
    dttl: 0,
    loss_rate: 0.0,
    is_synthetic: true,
    ingestion_source: "simulator_stream",
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    prediction: {
      predicted_category: "PortScan",
      is_threat: true,
      threat_score: 1.0,
      severity: "medium",
      latency_ms: 0.051,
      model_version: "v1.0.0-xgb",
      feature_contributions: [
        { feature: "dst_bytes", raw_value: 0.0, contribution: 0.214, direction: "positive" },
        { feature: "duration", raw_value: 0.001, contribution: 0.185, direction: "positive" }
      ]
    }
  },
  {
    id: "ev-104",
    workspace_id: "soc-primary",
    event_timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    source_ip: "192.168.1.102",
    destination_ip: "10.0.0.8",
    source_port: 58210,
    destination_port: 443,
    protocol: "tcp",
    service: "ssl",
    duration: 1.45,
    src_bytes: 2100,
    dst_bytes: 18400,
    src_pkts: 19,
    dst_pkts: 28,
    sload: 11586.2,
    dload: 101517.2,
    sttl: 64,
    dttl: 64,
    loss_rate: 0.0,
    is_synthetic: true,
    ingestion_source: "simulator_stream",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    prediction: {
      predicted_category: "Benign",
      is_threat: false,
      threat_score: 0.0002,
      severity: "benign",
      latency_ms: 0.049,
      model_version: "v1.0.0-xgb",
      feature_contributions: []
    }
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: "alt-001",
    workspace_id: "soc-primary",
    event_id: "ev-101",
    title: "Detected BruteForce Activity: 185.220.101.5 -> 10.0.0.5:22",
    category: "BruteForce",
    severity: "high",
    threat_score: 0.9997,
    status: "investigating",
    model_version: "v1.0.0-xgb",
    mitre_technique: "T1110 - Brute Force Credential Access",
    summary: "Automated threat detection engine flagged malicious BruteForce pattern with confidence 100.0%.",
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    event: INITIAL_EVENTS[0],
    notes: [
      {
        id: "note-1",
        author_name: "Lead Cyber Analyst",
        content: "Analyst verified repeated failed SSH connection attempts from 185.220.101.5.",
        is_ai_generated: false,
        created_at: new Date(Date.now() - 1000 * 60 * 1).toISOString()
      }
    ]
  },
  {
    id: "alt-002",
    workspace_id: "soc-primary",
    event_id: "ev-102",
    title: "Detected DoS Activity: 198.51.100.23 -> 10.0.0.2:80",
    category: "DoS",
    severity: "critical",
    threat_score: 1.0,
    status: "new",
    model_version: "v1.0.0-xgb",
    mitre_technique: "T1498 - Network Denial of Service",
    summary: "Automated threat detection engine flagged malicious DoS pattern with confidence 100.0%.",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    event: INITIAL_EVENTS[1],
    notes: []
  },
  {
    id: "alt-003",
    workspace_id: "soc-primary",
    event_id: "ev-103",
    title: "Detected PortScan Activity: 45.33.32.156 -> 192.168.1.45:1433",
    category: "PortScan",
    severity: "medium",
    threat_score: 1.0,
    status: "new",
    model_version: "v1.0.0-xgb",
    mitre_technique: "T1046 - Network Service Discovery",
    summary: "Automated threat detection engine flagged malicious PortScan pattern with confidence 100.0%.",
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    event: INITIAL_EVENTS[2],
    notes: []
  }
];

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "inc-001",
    workspace_id: "soc-primary",
    incident_number: "INC-202610-0023",
    title: "Coordinated DoS & BruteForce Campaign from 198.51.100.23",
    description: "Rule CORR-01 triggered: 5 alerts detected from external source 198.51.100.23 spanning categories: DoS & BruteForce.",
    status: "open",
    severity: "critical",
    lead_source_ip: "198.51.100.23",
    target_destination_ip: "10.0.0.2",
    correlation_rule: "CORR-01: Persistent Source Entity Clustering",
    alert_count: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: "inc-002",
    workspace_id: "soc-primary",
    incident_number: "INC-202610-9112",
    title: "Coordinated BruteForce & Exploits Campaign from 185.220.101.5",
    description: "Rule CORR-01 triggered: 3 alerts detected from external source 185.220.101.5 spanning categories: BruteForce & Exploits.",
    status: "investigating",
    severity: "high",
    lead_source_ip: "185.220.101.5",
    target_destination_ip: "10.0.0.5",
    correlation_rule: "CORR-01: Persistent Source Entity Clustering",
    alert_count: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  }
];

export const MODEL_EVALUATION_DATA: ModelEvaluationData = {
  model_name: "CybeWatch XGBoost IDS",
  model_version: "v1.0.0-xgb",
  algorithm: "XGBoost Gradient Boosted Decision Trees",
  dataset_name: "UNSW-NB15/CIC-IDS Statistical Benchmark",
  total_test_samples: 3000,
  classes: ["Benign", "Botnet", "BruteForce", "DoS", "Exploits", "PortScan"],
  overall_metrics: {
    accuracy: 0.9997,
    precision_weighted: 0.9997,
    recall_weighted: 0.9997,
    f1_weighted: 0.9997,
    f1_macro: 0.9996,
    roc_auc_weighted: 1.0,
    benign_fpr: 0.0,
    avg_latency_ms: 0.050
  },
  per_class_metrics: {
    Benign: { precision: 1.0, recall: 0.9994, f1_score: 0.9997, support: 1808 },
    Botnet: { precision: 1.0, recall: 1.0, f1_score: 1.0, support: 148 },
    BruteForce: { precision: 0.9959, recall: 1.0, f1_score: 0.9979, support: 242 },
    DoS: { precision: 1.0, recall: 1.0, f1_score: 1.0, support: 359 },
    Exploits: { precision: 1.0, recall: 1.0, f1_score: 1.0, support: 150 },
    PortScan: { precision: 1.0, recall: 1.0, f1_score: 1.0, support: 293 }
  },
  confusion_matrix: {
    labels: ["Benign", "Botnet", "BruteForce", "DoS", "Exploits", "PortScan"],
    matrix: [
      [1807, 0, 1, 0, 0, 0],
      [0, 148, 0, 0, 0, 0],
      [0, 0, 242, 0, 0, 0],
      [0, 0, 0, 359, 0, 0],
      [0, 0, 0, 0, 150, 0],
      [0, 0, 0, 0, 0, 293]
    ]
  },
  feature_importances: [
    { feature: "service_ssh", importance: 0.1955 },
    { feature: "sload", importance: 0.1742 },
    { feature: "duration", importance: 0.1386 },
    { feature: "destination_port", importance: 0.1192 },
    { feature: "src_bytes", importance: 0.0984 },
    { feature: "sttl", importance: 0.0821 },
    { feature: "src_pkts", importance: 0.0654 },
    { feature: "loss_rate", importance: 0.0431 }
  ],
  candidate_comparison: {
    logistic_regression: { name: "Logistic Regression (Baseline)", accuracy: 0.9910, f1_weighted: 0.9911 },
    random_forest: { name: "Random Forest", accuracy: 1.0, f1_weighted: 1.0 },
    xgboost: { name: "XGBoost Classifier (Production)", accuracy: 0.9997, f1_weighted: 0.9997 }
  },
  known_limitations: [
    "Trained on statistical flow distribution benchmarks; zero-day protocol exploits with unseen header variations require continuous retraining.",
    "Encrypted payloads cannot be deep-inspected; detection relies strictly on transport layer telemetry, packet sizes, and flow timing.",
    "High network throughput (>100 Gbps) requires distributed flow sampling before feeding into the inference pipeline."
  ],
  evaluated_at: new Date().toISOString()
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud-001",
    user_name: "Lead Cyber Analyst",
    action: "ALERT_STATUS_UPDATE",
    resource_type: "alert",
    resource_id: "alt-001",
    details: { old_status: "new", new_status: "investigating" },
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  },
  {
    id: "aud-002",
    user_name: "System Engine",
    action: "INCIDENT_CORRELATION_TRIGGERED",
    resource_type: "incident",
    resource_id: "inc-001",
    details: { rule: "CORR-01", clustered_alerts: 5 },
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  }
];
