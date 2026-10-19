import {
  User,
  Workspace,
  SecurityEvent,
  Prediction,
  Alert,
  Incident,
  DashboardAnalytics,
  AIInvestigationResponse,
  ModelEvaluationData,
  AuditLog
} from '../types';
import {
  INITIAL_ANALYTICS,
  INITIAL_EVENTS,
  INITIAL_ALERTS,
  INITIAL_INCIDENTS,
  MODEL_EVALUATION_DATA,
  INITIAL_AUDIT_LOGS
} from './mockData';

const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;
  private isStaticHosting: boolean;

  constructor() {
    this.token = localStorage.getItem('cybewatch_token');
    // Check if hosted on GitHub Pages or static host
    this.isStaticHosting = typeof window !== 'undefined' && (
      window.location.hostname.endsWith('github.io') ||
      window.location.protocol === 'file:'
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('cybewatch_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('cybewatch_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (this.isStaticHosting) {
      throw new Error("Static hosting fallback");
    }

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      return response.json();
    } catch (err) {
      throw err;
    }
  }

  // Auth & Workspaces
  async getMe(): Promise<User> {
    try {
      return await this.request<User>('/auth/me');
    } catch {
      return {
        id: "usr-admin",
        email: "analyst@cybewatch.ai",
        full_name: "Lead Cyber Analyst",
        role: "admin",
        is_active: true,
        created_at: new Date().toISOString()
      };
    }
  }

  async getWorkspaces(): Promise<Workspace[]> {
    try {
      return await this.request<Workspace[]>('/workspaces');
    } catch {
      return [{
        id: "soc-primary",
        name: "Primary Security Operations Center",
        slug: "soc-primary",
        description: "Default SOC Workspace",
        created_at: new Date().toISOString()
      }];
    }
  }

  async getCurrentWorkspace(): Promise<Workspace> {
    try {
      return await this.request<Workspace>('/workspaces/current');
    } catch {
      return {
        id: "soc-primary",
        name: "Primary Security Operations Center",
        slug: "soc-primary",
        description: "Production Monitoring",
        created_at: new Date().toISOString()
      };
    }
  }

  // Dashboard Analytics
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    try {
      return await this.request<DashboardAnalytics>('/analytics/dashboard');
    } catch {
      const stored = localStorage.getItem('cybewatch_analytics');
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
      return INITIAL_ANALYTICS;
    }
  }

  // Security Events
  async getEvents(params: { skip?: number; limit?: number; source_ip?: string; protocol?: string; threat_only?: boolean } = {}): Promise<SecurityEvent[]> {
    try {
      const q = new URLSearchParams();
      if (params.skip !== undefined) q.set('skip', params.skip.toString());
      if (params.limit !== undefined) q.set('limit', params.limit.toString());
      if (params.source_ip) q.set('source_ip', params.source_ip);
      if (params.protocol) q.set('protocol', params.protocol);
      if (params.threat_only !== undefined) q.set('threat_only', params.threat_only.toString());
      return await this.request<SecurityEvent[]>(`/events?${q.toString()}`);
    } catch {
      let events = INITIAL_EVENTS;
      const stored = localStorage.getItem('cybewatch_events');
      if (stored) {
        try { events = JSON.parse(stored); } catch {}
      }

      if (params.source_ip) {
        events = events.filter(e => e.source_ip.toLowerCase().includes(params.source_ip!.toLowerCase()));
      }
      if (params.protocol) {
        events = events.filter(e => e.protocol.toLowerCase() === params.protocol!.toLowerCase());
      }
      if (params.threat_only !== undefined) {
        events = events.filter(e => Boolean(e.prediction?.is_threat) === params.threat_only);
      }
      return events.slice(params.skip || 0, (params.skip || 0) + (params.limit || 50));
    }
  }

  async ingestEvent(eventData: Partial<SecurityEvent>): Promise<SecurityEvent> {
    try {
      return await this.request<SecurityEvent>('/events/ingest', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
    } catch {
      const isThreat = eventData.destination_port === 22 || (eventData.src_bytes || 0) > 10000;
      const cat = eventData.destination_port === 22 ? 'BruteForce' : (isThreat ? 'DoS' : 'Benign');
      const score = isThreat ? 0.998 : 0.002;
      const sev = isThreat ? 'high' : 'benign';

      const newEvent: SecurityEvent = {
        id: `ev-${Date.now().toString().slice(-4)}`,
        workspace_id: 'soc-primary',
        event_timestamp: new Date().toISOString(),
        source_ip: eventData.source_ip || '198.51.100.23',
        destination_ip: eventData.destination_ip || '10.0.0.2',
        source_port: eventData.source_port || 49120,
        destination_port: eventData.destination_port || 80,
        protocol: eventData.protocol || 'tcp',
        service: eventData.service || '-',
        duration: eventData.duration || 0.05,
        src_bytes: eventData.src_bytes || 12000,
        dst_bytes: eventData.dst_bytes || 400,
        src_pkts: eventData.src_pkts || 120,
        dst_pkts: eventData.dst_pkts || 2,
        sload: eventData.sload || 1920000,
        dload: eventData.dload || 64000,
        sttl: eventData.sttl || 48,
        dttl: eventData.dttl || 0,
        loss_rate: eventData.loss_rate || 0.1,
        is_synthetic: true,
        ingestion_source: 'sandbox',
        created_at: new Date().toISOString(),
        prediction: {
          predicted_category: cat,
          is_threat: isThreat,
          threat_score: score,
          severity: sev as any,
          latency_ms: 0.051,
          model_version: 'v1.0.0-xgb',
          feature_contributions: [
            { feature: 'src_bytes', raw_value: eventData.src_bytes || 12000, contribution: 0.154, direction: 'positive' }
          ]
        }
      };

      const stored = localStorage.getItem('cybewatch_events');
      const events: SecurityEvent[] = stored ? JSON.parse(stored) : [...INITIAL_EVENTS];
      events.unshift(newEvent);
      localStorage.setItem('cybewatch_events', JSON.stringify(events));

      if (isThreat) {
        const newAlert: Alert = {
          id: `alt-${Date.now().toString().slice(-4)}`,
          workspace_id: 'soc-primary',
          event_id: newEvent.id,
          title: `Detected ${cat} Activity: ${newEvent.source_ip} -> ${newEvent.destination_ip}:${newEvent.destination_port}`,
          category: cat,
          severity: sev as any,
          threat_score: score,
          status: 'new',
          model_version: 'v1.0.0-xgb',
          mitre_technique: cat === 'BruteForce' ? 'T1110 - Brute Force' : 'T1498 - Network DoS',
          summary: `Automated detection engine flagged ${cat} pattern with confidence ${(score*100).toFixed(1)}%.`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          event: newEvent,
          notes: []
        };
        const storedAlerts = localStorage.getItem('cybewatch_alerts');
        const alerts: Alert[] = storedAlerts ? JSON.parse(storedAlerts) : [...INITIAL_ALERTS];
        alerts.unshift(newAlert);
        localStorage.setItem('cybewatch_alerts', JSON.stringify(alerts));
      }

      return newEvent;
    }
  }

  async simulateTraffic(count: number = 15): Promise<any> {
    try {
      return await this.request<any>(`/events/simulate?count=${count}`, {
        method: 'POST',
      });
    } catch {
      // Client-side replay simulation for static demo
      const simulated: SecurityEvent[] = [];
      const now = Date.now();
      for (let i = 0; i < count; i++) {
        const isThreat = i % 2 === 0;
        const cat = isThreat ? (['DoS', 'BruteForce', 'PortScan', 'Exploits', 'Botnet'][i % 5]) : 'Benign';
        simulated.push({
          id: `ev-sim-${now}-${i}`,
          workspace_id: 'soc-primary',
          event_timestamp: new Date(now - i * 1000 * 30).toISOString(),
          source_ip: isThreat ? `198.51.100.${20 + (i % 5)}` : `192.168.1.${10 + i}`,
          destination_ip: `10.0.0.${2 + (i % 8)}`,
          source_port: 32000 + i * 100,
          destination_port: cat === 'BruteForce' ? 22 : (cat === 'DoS' ? 80 : (cat === 'PortScan' ? 1433 : 443)),
          protocol: 'tcp',
          service: cat === 'BruteForce' ? 'ssh' : (cat === 'DoS' ? 'http' : 'ssl'),
          duration: cat === 'PortScan' ? 0.002 : (cat === 'BruteForce' ? 2.5 : 0.8),
          src_bytes: isThreat ? 24000 : 1800,
          dst_bytes: isThreat ? 120 : 14000,
          src_pkts: isThreat ? 400 : 15,
          dst_pkts: isThreat ? 2 : 25,
          sload: isThreat ? 4800000 : 18000,
          dload: isThreat ? 24000 : 140000,
          sttl: 50,
          dttl: 64,
          loss_rate: isThreat ? 0.25 : 0.0,
          is_synthetic: true,
          ingestion_source: 'simulator_stream',
          created_at: new Date(now - i * 1000 * 30).toISOString(),
          prediction: {
            predicted_category: cat,
            is_threat: isThreat,
            threat_score: isThreat ? 0.999 : 0.001,
            severity: isThreat ? (cat === 'DoS' ? 'critical' : 'high') : 'benign',
            latency_ms: 0.05,
            model_version: 'v1.0.0-xgb'
          }
        });
      }

      const stored = localStorage.getItem('cybewatch_events');
      const events: SecurityEvent[] = stored ? JSON.parse(stored) : [...INITIAL_EVENTS];
      const merged = [...simulated, ...events].slice(0, 200);
      localStorage.setItem('cybewatch_events', JSON.stringify(merged));

      return {
        total_received: count,
        total_ingested: count,
        threats_detected: Math.ceil(count / 2),
        alerts_generated: Math.ceil(count / 2),
        processing_time_ms: 50.2
      };
    }
  }

  async uploadCSV(file: File, isSynthetic: boolean = false): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const headers = new Headers();
      if (this.token) headers.set('Authorization', `Bearer ${this.token}`);

      const res = await fetch(`${API_BASE}/events/upload-csv?is_synthetic=${isSynthetic}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      return res.json();
    } catch {
      return {
        total_received: 25,
        total_ingested: 25,
        threats_detected: 18,
        alerts_generated: 18,
        processing_time_ms: 124.5
      };
    }
  }

  // Real-time Prediction Sandbox
  async testPredict(eventData: Record<string, any>): Promise<Prediction> {
    try {
      return await this.request<Prediction>('/detection/predict', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
    } catch {
      const port = Number(eventData.destination_port || 80);
      const srcPkts = Number(eventData.src_pkts || 0);
      const sload = Number(eventData.sload || 0);

      let cat = 'Benign';
      let threat = false;
      let score = 0.0003;
      let sev: any = 'benign';

      if (port === 22 || eventData.service === 'ssh') {
        cat = 'BruteForce';
        threat = true;
        score = 0.9995;
        sev = 'high';
      } else if (srcPkts > 200 || sload > 1000000) {
        cat = 'DoS';
        threat = true;
        score = 0.9998;
        sev = 'critical';
      } else if (port === 1433 || port === 3389 || (eventData.duration || 0) < 0.005) {
        cat = 'PortScan';
        threat = true;
        score = 0.9992;
        sev = 'medium';
      } else if (Number(eventData.src_bytes || 0) > 20000) {
        cat = 'Exploits';
        threat = true;
        score = 0.9984;
        sev = 'critical';
      }

      return {
        predicted_category: cat,
        is_threat: threat,
        threat_score: score,
        severity: sev,
        latency_ms: 0.050,
        model_version: 'v1.0.0-xgb',
        class_probabilities: {
          Benign: cat === 'Benign' ? 0.999 : 0.001,
          DoS: cat === 'DoS' ? 0.999 : 0.0,
          PortScan: cat === 'PortScan' ? 0.999 : 0.0,
          BruteForce: cat === 'BruteForce' ? 0.999 : 0.0,
          Exploits: cat === 'Exploits' ? 0.998 : 0.0,
          Botnet: 0.0
        },
        feature_contributions: [
          { feature: 'destination_port', raw_value: port, contribution: threat ? 0.185 : -0.05, direction: threat ? 'positive' : 'negative' },
          { feature: 'src_pkts', raw_value: srcPkts, contribution: srcPkts > 100 ? 0.142 : -0.02, direction: srcPkts > 100 ? 'positive' : 'negative' },
          { feature: 'sload', raw_value: sload, contribution: sload > 500000 ? 0.198 : -0.03, direction: sload > 500000 ? 'positive' : 'negative' }
        ]
      };
    }
  }

  // Alerts
  async getAlerts(params: { skip?: number; limit?: number; severity?: string; category?: string; status?: string; search?: string } = {}): Promise<Alert[]> {
    try {
      const q = new URLSearchParams();
      if (params.skip !== undefined) q.set('skip', params.skip.toString());
      if (params.limit !== undefined) q.set('limit', params.limit.toString());
      if (params.severity) q.set('severity', params.severity);
      if (params.category) q.set('category', params.category);
      if (params.status) q.set('status', params.status);
      if (params.search) q.set('search', params.search);
      return await this.request<Alert[]>(`/alerts?${q.toString()}`);
    } catch {
      let alerts = INITIAL_ALERTS;
      const stored = localStorage.getItem('cybewatch_alerts');
      if (stored) {
        try { alerts = JSON.parse(stored); } catch {}
      }

      if (params.severity) {
        alerts = alerts.filter(a => a.severity.toLowerCase() === params.severity!.toLowerCase());
      }
      if (params.category) {
        alerts = alerts.filter(a => a.category.toLowerCase().includes(params.category!.toLowerCase()));
      }
      if (params.status) {
        alerts = alerts.filter(a => a.status.toLowerCase() === params.status!.toLowerCase());
      }
      if (params.search) {
        alerts = alerts.filter(a =>
          a.title.toLowerCase().includes(params.search!.toLowerCase()) ||
          a.id.toLowerCase().includes(params.search!.toLowerCase()) ||
          (a.event?.source_ip && a.event.source_ip.includes(params.search!))
        );
      }
      return alerts.slice(params.skip || 0, (params.skip || 0) + (params.limit || 50));
    }
  }

  async getAlertDetail(id: string): Promise<Alert> {
    try {
      return await this.request<Alert>(`/alerts/${id}`);
    } catch {
      const alerts = await this.getAlerts({ limit: 100 });
      const found = alerts.find(a => a.id === id);
      return found || INITIAL_ALERTS[0];
    }
  }

  async updateAlertStatus(id: string, status: string, notes?: string): Promise<Alert> {
    try {
      return await this.request<Alert>(`/alerts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
    } catch {
      const stored = localStorage.getItem('cybewatch_alerts');
      const alerts: Alert[] = stored ? JSON.parse(stored) : [...INITIAL_ALERTS];
      const alert = alerts.find(a => a.id === id) || alerts[0];
      alert.status = status as any;
      if (notes) {
        if (!alert.notes) alert.notes = [];
        alert.notes.unshift({
          id: `note-${Date.now()}`,
          author_name: 'Lead Cyber Analyst',
          content: notes,
          is_ai_generated: false,
          created_at: new Date().toISOString()
        });
      }
      localStorage.setItem('cybewatch_alerts', JSON.stringify(alerts));
      return alert;
    }
  }

  async assignAlert(id: string, analystId?: string): Promise<Alert> {
    try {
      const q = analystId ? `?analyst_id=${analystId}` : '';
      return await this.request<Alert>(`/alerts/${id}/assign${q}`, {
        method: 'POST',
      });
    } catch {
      return this.getAlertDetail(id);
    }
  }

  async addAlertNote(id: string, content: string, isAiGenerated: boolean = false): Promise<any> {
    try {
      return await this.request<any>(`/alerts/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content, is_ai_generated: isAiGenerated }),
      });
    } catch {
      const stored = localStorage.getItem('cybewatch_alerts');
      const alerts: Alert[] = stored ? JSON.parse(stored) : [...INITIAL_ALERTS];
      const alert = alerts.find(a => a.id === id) || alerts[0];
      if (!alert.notes) alert.notes = [];
      alert.notes.unshift({
        id: `note-${Date.now()}`,
        author_name: 'Lead Cyber Analyst',
        content,
        is_ai_generated: isAiGenerated,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('cybewatch_alerts', JSON.stringify(alerts));
      return { id: `note-${Date.now()}`, content, is_ai_generated: isAiGenerated };
    }
  }

  // Incidents
  async getIncidents(): Promise<Incident[]> {
    try {
      return await this.request<Incident[]>('/incidents');
    } catch {
      const stored = localStorage.getItem('cybewatch_incidents');
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
      return INITIAL_INCIDENTS;
    }
  }

  async getIncidentDetail(id: string): Promise<Incident> {
    try {
      return await this.request<Incident>(`/incidents/${id}`);
    } catch {
      const incs = await this.getIncidents();
      return incs.find(i => i.id === id) || INITIAL_INCIDENTS[0];
    }
  }

  async runCorrelation(timeWindowMinutes: number = 180): Promise<Incident[]> {
    try {
      return await this.request<Incident[]>(`/incidents/correlate?time_window_minutes=${timeWindowMinutes}`, {
        method: 'POST',
      });
    } catch {
      return INITIAL_INCIDENTS;
    }
  }

  // AI Investigator
  async investigate(target: { alert_id?: string; incident_id?: string; query?: string }): Promise<AIInvestigationResponse> {
    try {
      return await this.request<AIInvestigationResponse>('/investigator/investigate', {
        method: 'POST',
        body: JSON.stringify(target),
      });
    } catch {
      const alert = target.alert_id ? await this.getAlertDetail(target.alert_id) : INITIAL_ALERTS[0];
      const srcIp = alert.event?.source_ip || '185.220.101.5';
      const dstIp = alert.event?.destination_ip || '10.0.0.5';
      const dstPort = alert.event?.destination_port || 22;

      return {
        target_id: alert.id,
        target_type: 'alert',
        summary: `**Alert Investigation (${alert.category})**: Automated ML IDS flagged high-confidence anomalous flow from ${srcIp} to ${dstIp}:${dstPort} matching **${alert.category}** threat patterns (Score: ${(alert.threat_score * 100).toFixed(1)}%). Deterministic evaluation recommends immediate host-level audit on ${dstIp} and perimeter boundary inspection.`,
        observed_evidence: [
          `Inbound network flow initiated from ${srcIp} targeting ${dstIp} on port ${dstPort}/${alert.event?.protocol || 'tcp'}.`,
          `Flow telemetry: duration=${alert.event?.duration}s, src_bytes=${alert.event?.src_bytes}, dst_bytes=${alert.event?.dst_bytes}, packets=${alert.event?.src_pkts} (in) / ${alert.event?.dst_pkts} (out).`,
          `Machine Learning model 'XGBoost IDS' classified traffic as '${alert.category}' with score ${(alert.threat_score * 100).toFixed(2)}%.`,
          `Severity assigned: ${alert.severity.toUpperCase()}.`
        ],
        attack_hypotheses: [
          {
            hypothesis: alert.category === 'BruteForce' ? 'Automated Credential Stuffing / Dictionary Attack' : `Active Inbound Cyber Threat (${alert.category})`,
            likelihood: 'High',
            basis: `Repeated connection bursts targeting destination port ${dstPort} matching anomalous baseline deviations.`,
            mitre_id: alert.mitre_technique || 'T1110 - Brute Force'
          },
          {
            hypothesis: 'Authorized Internal Automated Diagnostic Task',
            likelihood: 'Low',
            basis: 'Scheduled monitoring probe with unrotated or expired service credential.',
            mitre_id: 'N/A'
          }
        ],
        recommended_actions: [
          {
            step: '1. Verify Destination Asset Criticality',
            description: `Check internal asset registry for ${dstIp} to establish service role, data classification, and exposure level.`,
            requires_human_approval: 'True'
          },
          {
            step: '2. Correlate Host System & Auth Logs',
            description: `Query syslog / Windows Event Viewer on ${dstIp} for failed logins (Event 4625) or unexpected process execution.`,
            requires_human_approval: 'True'
          },
          {
            step: '3. Evaluate Perimeter Firewall Quarantine',
            description: `Consider applying temporary rate-limiting or drop rule at perimeter firewall for external IP ${srcIp}.`,
            requires_human_approval: 'True - Do NOT auto-block'
          }
        ],
        missing_telemetry: [
          `Host endpoint telemetry (EDR/Sysmon) for destination host ${dstIp}.`,
          'L7 Application payload contents (HTTP URI, headers, or TLS SNI certificates).'
        ],
        confidence_statement: `High confidence (Score: ${(alert.threat_score * 100).toFixed(1)}%) in transport-level statistical anomaly detection.`,
        generated_at: new Date().toISOString(),
        provider: 'deterministic_soc_expert'
      };
    }
  }

  // ML Lab & Evaluation
  async getModelEvaluation(): Promise<ModelEvaluationData> {
    try {
      return await this.request<ModelEvaluationData>('/ml/evaluation');
    } catch {
      return MODEL_EVALUATION_DATA;
    }
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      return await this.request<AuditLog[]>('/audit');
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }
}

export const api = new ApiClient();
