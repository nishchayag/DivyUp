import { NextRequest } from "next/server";
import AuditLog from "@/models/AuditLog";
import { TenantContext } from "@/lib/tenant";

interface AuditOptions {
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(
  req: NextRequest,
  ctx: TenantContext,
  options: AuditOptions,
) {
  await AuditLog.create({
    organization: ctx.organization._id,
    user: ctx.user._id,
    action: options.action,
    entityType: options.entityType,
    entityId: options.entityId,
    metadata: options.metadata,
    method: req.method,
    path: req.nextUrl.pathname,
  });
}
