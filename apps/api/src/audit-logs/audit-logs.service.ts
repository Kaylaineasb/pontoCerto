import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type AuditAction =
  | "TIME_ENTRY_CREATED"
  | "TIME_ENTRY_UPDATED"
  | "ADJUSTMENT_REQUEST_CREATED"
  | "ADJUSTMENT_APPROVED"
  | "ADJUSTMENT_REJECTED";

@Injectable()
export class AuditLogsService {
  constructor(private prismaService: PrismaService) {}

  async log(params: {
    orgId: string;
    actorId: string;
    action: AuditAction;
    entity: string;
    entityId: string;
    metadata?: Record<string, any>;
  }) {
    const { orgId, actorId, action, entity, entityId, metadata } = params;

    return this.prismaService.prisma.auditLog.create({
      data: {
        orgId,
        actorId,
        action,
        entity,
        entityId,
        metadata: metadata ?? {},
      },
    });
  }
}
