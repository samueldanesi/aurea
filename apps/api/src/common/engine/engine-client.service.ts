import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/** Thin HTTP client to the Python engine service (connectors, ETL, AI/RAG). */
@Injectable()
export class EngineClientService {
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: this.config.get<string>('ENGINE_BASE_URL'),
      timeout: 30_000,
    });
  }

  async storeSecret(tenantId: string, payload: Record<string, unknown>) {
    const res = await this.http.post('/vault/secrets', { tenantId, payload });
    return res.data.secretRef as string;
  }

  async triggerSync(tenantId: string, connectionId: string) {
    const res = await this.http.post('/sync/trigger', { tenantId, connectionId });
    return res.data;
  }

  async chat(tenantId: string, userId: string, conversationId: string | null, message: string) {
    const res = await this.http.post('/ai/chat', {
      tenantId,
      userId,
      conversationId,
      message,
    });
    return res.data;
  }

  async getDashboardPdf(tenantId: string, dashboardId: string): Promise<Buffer> {
    const res = await this.http.get(`/reports/dashboard/${tenantId}/${dashboardId}/pdf`, {
      responseType: 'arraybuffer',
    });
    return Buffer.from(res.data);
  }

  async getKpiValues(tenantId: string, kpiKey: string) {
    const res = await this.http.get(`/kpi/${tenantId}/${kpiKey}/values`);
    return res.data;
  }

  async testConnection(tenantId: string, connectorType: string, config: Record<string, unknown>, secretRef?: string) {
    const res = await this.http.post('/connectors/test', {
      tenantId,
      connectorType,
      config,
      secretRef,
    });
    return res.data;
  }
}
