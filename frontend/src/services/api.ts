/**
 * ThreatLens API Client Service
 */
import {
  Incident,
  ThreatCampaign,
  Asset,
  DashboardKPIs,
  PipelineStatus,
  ScalabilityBenchmark,
  NormalizedAlert,
  AuditLogEntry,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Analytics & Dashboard
  async getDashboard(): Promise<DashboardKPIs> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  // Incidents
  async getIncidents(params?: {
    status?: string;
    severity?: string;
    criticality?: string;
    campaign_id?: string;
    search?: string;
  }): Promise<Incident[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.criticality) searchParams.append('criticality', params.criticality);
    if (params?.campaign_id) searchParams.append('campaign_id', params.campaign_id);
    if (params?.search) searchParams.append('search', params.search);

    const res = await fetch(`${API_BASE}/incidents?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncidentById(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
    return res.json();
  },

  async getIncidentAlerts(id: string): Promise<NormalizedAlert[]> {
    const res = await fetch(`${API_BASE}/incidents/${id}/alerts`);
    if (!res.ok) throw new Error(`Failed to fetch alerts for incident ${id}`);
    return res.json();
  },

  async updateIncidentStatus(
    id: string,
    status: string,
    notes?: string,
    analystName?: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes, analyst_name: analystName }),
    });
    if (!res.ok) throw new Error('Failed to update incident status');
    return res.json();
  },

  async overrideIncident(id: string, payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to override incident properties');
    return res.json();
  },

  async toggleMitreTechnique(id: string, techniqueId: string, action: 'REMOVE' | 'CONFIRM'): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/mitre/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technique_id: techniqueId, action }),
    });
    if (!res.ok) throw new Error('Failed to toggle MITRE technique');
    return res.json();
  },

  // Campaigns
  async getCampaigns(): Promise<ThreatCampaign[]> {
    const res = await fetch(`${API_BASE}/campaigns`);
    if (!res.ok) throw new Error('Failed to fetch campaigns');
    return res.json();
  },

  // MITRE
  async getMitreCoverage(): Promise<any> {
    const res = await fetch(`${API_BASE}/mitre/coverage`);
    if (!res.ok) throw new Error('Failed to fetch MITRE coverage');
    return res.json();
  },

  // Assets
  async getAssets(): Promise<Asset[]> {
    const res = await fetch(`${API_BASE}/assets`);
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  // Pipeline
  async getPipelineStatus(): Promise<PipelineStatus> {
    const res = await fetch(`${API_BASE}/pipeline/status`);
    if (!res.ok) throw new Error('Failed to fetch pipeline status');
    return res.json();
  },

  // Benchmarks
  async getScalabilityBenchmarks(): Promise<ScalabilityBenchmark[]> {
    const res = await fetch(`${API_BASE}/benchmarks/scalability`);
    if (!res.ok) throw new Error('Failed to fetch benchmarks');
    return res.json();
  },

  async getEvaluationMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/benchmarks/evaluation`);
    if (!res.ok) throw new Error('Failed to fetch evaluation metrics');
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await fetch(`${API_BASE}/audit`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Global Search
  async search(query: string): Promise<any> {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  // Simulation
  async runSimulation(volume = 3000, useCurrentDataset = false): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume, use_current_dataset: useCurrentDataset }),
    });
    if (!res.ok) throw new Error('Simulation failed to run');
    return res.json();
  },

  async runBatchJob(volume = 10000, partitions = 16): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume, partitions }),
    });
    if (!res.ok) throw new Error('Batch job failed to start');
    return res.json();
  },

  // Datasets
  async getDatasets(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/datasets`);
    if (!res.ok) throw new Error('Failed to fetch datasets');
    return res.json();
  },

  async loadDataset(datasetId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/datasets/load/${datasetId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Failed to load dataset ${datasetId}`);
    return res.json();
  },

  async uploadDataset(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload custom dataset');
    return res.json();
  },

  // Auth / Role
  async switchRole(role: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return res.json();
  },
};

