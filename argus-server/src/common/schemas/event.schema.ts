import { z } from 'zod';

export const NormalizedEventSchema = z.object({
  source: z.string(),
  event_type: z.string(),
  ip: z.string().nullable(),
  username: z.string().nullable(),
  timestamp: z.string().datetime(),
  details: z.record(z.string(), z.unknown()),
  hash: z.string().length(64),
});

export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;

export const StoredEventSchema = NormalizedEventSchema.extend({
  id: z.number(),
});

export type StoredEvent = z.infer<typeof StoredEventSchema>;

export const RawJsonLogSchema = z.object({
  format: z.literal('json'),
  source: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export const RawSyslogSchema = z.object({
  format: z.literal('syslog'),
  raw: z.string(),
});

export const RawCsvSchema = z.object({
  format: z.literal('csv'),
  source: z.string(),
  data: z.string(),
});

export const RawLogSchema = z.discriminatedUnion('format', [
  RawJsonLogSchema,
  RawSyslogSchema,
  RawCsvSchema,
]);

export const MockLogsFileSchema = z.object({
  description: z.string().optional(),
  logs: z.array(RawLogSchema),
});

export const CorrelationRuleSchema = z.object({
  rule: z.string(),
  name: z.string(),
  description: z.string(),
  condition: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  action: z.string(),
});

export type CorrelationRule = z.infer<typeof CorrelationRuleSchema>;

export const AlertSchema = z.object({
  id: z.number(),
  rule: z.string(),
  name: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  triggered_at: z.string().datetime(),
  related_events: z.array(z.number()),
  evidence: z.record(z.string(), z.unknown()),
});

export type Alert = z.infer<typeof AlertSchema>;

export const IngestEventDtoSchema = z.object({
  source: z.string(),
  event_type: z.string(),
  ip: z.string().optional(),
  username: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type IngestEventDto = z.infer<typeof IngestEventDtoSchema>;
