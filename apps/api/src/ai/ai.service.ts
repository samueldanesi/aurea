import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db/db.service';
import { EngineClientService } from '../common/engine/engine-client.service';

@Injectable()
export class AiService {
  constructor(
    private readonly db: DbService,
    private readonly engine: EngineClientService,
  ) {}

  async chat(
    tenantId: string,
    userId: string,
    conversationId: string | null,
    message: string,
  ) {
    const convoId = await this.db.withTenant(tenantId, async (client) => {
      if (conversationId) return conversationId;
      const res = await client.query(
        `INSERT INTO app.ai_conversations (tenant_id, user_id, title)
         VALUES ($1, $2, $3) RETURNING id`,
        [tenantId, userId, message.slice(0, 80)],
      );
      return res.rows[0].id as string;
    });

    await this.db.withTenant(tenantId, (client) =>
      client.query(
        `INSERT INTO app.ai_messages (tenant_id, conversation_id, role, content)
         VALUES ($1, $2, 'user', $3)`,
        [tenantId, convoId, message],
      ),
    );

    // The engine is the only component allowed to call the LLM. It runs NL-to-SQL
    // against the tenant's semantic layer, executes the query for real, and returns
    // both the answer and the SQL/result it derived it from -- see apps/engine's
    // AI guardrail notes for why we never let the model state a figure it didn't query.
    const result = await this.engine.chat(tenantId, userId, convoId, message);

    await this.db.withTenant(tenantId, (client) =>
      client.query(
        `INSERT INTO app.ai_messages
           (tenant_id, conversation_id, role, content, generated_sql, result_rows, model_used)
         VALUES ($1, $2, 'assistant', $3, $4, $5, $6)`,
        [
          tenantId,
          convoId,
          result.answer,
          result.generatedSql ?? null,
          result.resultRows ? JSON.stringify(result.resultRows) : null,
          result.modelUsed ?? null,
        ],
      ),
    );

    return { conversationId: convoId, ...result };
  }

  history(tenantId: string, conversationId: string) {
    return this.db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `SELECT role, content, generated_sql, result_rows, model_used, created_at
         FROM app.ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [conversationId],
      );
      return res.rows;
    });
  }
}
