import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTimeEntryDto } from "./dto/create-time-entry.dto";
import { TimeEntryType } from "@prisma/client";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

const DAILY_WORK_SECONDS = 8 * 60 * 60;

@Injectable()
export class TimeEntriesService {
  constructor(
    private prismaService: PrismaService,
    private audit: AuditLogsService
  ) { }

  async create(userId: string, orgId: string, dto: CreateTimeEntryDto) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const entriesToday = await this.prismaService.prisma.timeEntry.findMany({
      where: { orgId, userId, timestamp: { gte: start } },
      orderBy: [{ sequence: "asc" }, { timestamp: "asc" }],
      select: { id: true, type: true, sequence: true },
    });

    if (entriesToday.length >= 4) {
      throw new BadRequestException("Limite de 4 batidas atingido no dia");
    }

    const last = entriesToday.at(-1) ?? null;
    const expected = !last ? TimeEntryType.IN : this.nextType(last.type);

    if (dto.type !== expected) {
      throw new BadRequestException(`Batida inválida. Esperado: ${expected}`);
    }

    const sequence = entriesToday.length + 1;

    const entry = await this.prismaService.prisma.timeEntry.create({
      data: {
        orgId,
        userId,
        type: dto.type,
        sequence,
        timestamp: new Date(),

        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracyM: dto.accuracyM,

        photoBase64: dto.photoBase64,
        photoMime: dto.photoMime,
      },
      select: {
        id: true,
        type: true,
        timestamp: true,
        sequence: true,
      },
    });

    await this.audit.log({
      orgId,
      actorId: userId,
      action: "TIME_ENTRY_CREATED",
      entity: "TimeEntry",
      entityId: entry.id,
      metadata: {
        type: entry.type,
        sequence: entry.sequence,
        timestamp: entry.timestamp.toISOString(),
        gps: {
          lat: dto.latitude,
          lng: dto.longitude,
          accuracyM: dto.accuracyM,
        },
        hasPhoto: !!dto.photoBase64,
        photoMime: dto.photoMime ?? null,
        source: "MOBILE",
      },
    });

    return entry;
  }

  async getToday(userId: string, orgId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const entries = await this.prismaService.prisma.timeEntry.findMany({
      where: { orgId, userId, timestamp: { gte: start } },
      orderBy: [{ sequence: "asc" }, { timestamp: "asc" }],
      select: { id: true, type: true, timestamp: true, sequence: true },
    });

    const last = entries.at(-1) ?? null;

    const isComplete = last?.type === TimeEntryType.OUT;
    const summary = this.calculateTodaySummary(entries);

    const nextExpected = !last
      ? TimeEntryType.IN
      : isComplete
        ? null
        : this.nextType(last.type);

    return {
      date: start.toISOString(),
      entries,
      lastEntry: last,
      nextExpected,
      isComplete,
      summary,
    };
  }

  async list(userId: string, orgId: string, from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    return this.prismaService.prisma.timeEntry.findMany({
      where: {
        orgId,
        userId,
        timestamp: { gte: fromDate, lte: toDate },
      },
      orderBy: { timestamp: "desc" },
      select: { id: true, type: true, timestamp: true, sequence: true },
    });
  }

  async listByPeriod(userId: string, orgId: string, from: string, to: string) {
    // intervalo inclusivo: from 00:00:00 até to 23:59:59.999
    const fromDate = new Date(`${from}T00:00:00.000`);
    const toDate = new Date(`${to}T23:59:59.999`);

    const rows = await this.prismaService.prisma.timeEntry.findMany({
      where: {
        orgId,
        userId,
        timestamp: { gte: fromDate, lte: toDate },
      },
      orderBy: [{ timestamp: "asc" }, { sequence: "asc" }],
      select: {
        id: true,
        type: true,
        sequence: true,
        timestamp: true,
      },
    });

    return { from, to, items: rows };
  }

  async getByDate(userId: string, orgId: string, date: string) {
  const start = new Date(`${date}T00:00:00.000`);
  const end = new Date(`${date}T23:59:59.999`);

  const rows = await this.prismaService.prisma.timeEntry.findMany({
    where: {
      orgId,
      userId,
      timestamp: { gte: start, lte: end },
    },
    orderBy: [{ sequence: "asc" }, { timestamp: "asc" }],
    select: {
      id: true,
      type: true,
      sequence: true,
      timestamp: true,
      latitude: true,
      longitude: true,
      accuracyM: true,
      photoMime: true,
      photoBase64: false, // 🔥 NÃO retornar base64
    },
  });

  return {
    date,
    items: rows.map(r => ({
      ...r,
      hasPhoto: !!r.photoMime,
      photoId: r.photoMime ? r.id : null,
    })),
  };
}
async getPhoto(userId: string, orgId: string, id: string) {
  const entry = await this.prismaService.prisma.timeEntry.findFirst({
    where: {
      id,
      userId,
      orgId,
    },
    select: {
      photoBase64: true,
      photoMime: true,
    },
  });

  if (!entry?.photoBase64) return null;

  return entry;
}


  private calculateTodaySummary(
    entries: { type: TimeEntryType; timestamp: Date }[],
  ) {
    const inEntry = entries.find((e) => e.type === TimeEntryType.IN) ?? null;
    const outEntry =
      [...entries].reverse().find((e) => e.type === TimeEntryType.OUT) ?? null;

    const breakStart =
      entries.find((e) => e.type === TimeEntryType.BREAK_START) ?? null;
    const breakEnd =
      entries.find((e) => e.type === TimeEntryType.BREAK_END) ?? null;

    const breakSeconds =
      breakStart && breakEnd
        ? Math.max(0, Math.floor((+breakEnd.timestamp - +breakStart.timestamp) / 1000))
        : 0;

    let workedSeconds = 0;
    if (inEntry) {
      const end = outEntry ? outEntry.timestamp : new Date(); // previsto enquanto não finaliza
      workedSeconds = Math.max(
        0,
        Math.floor((+end - +inEntry.timestamp) / 1000) - breakSeconds,
      );
    }

    const balanceSeconds = workedSeconds - DAILY_WORK_SECONDS;

    return {
      workedSeconds,
      breakSeconds,
      balanceSeconds,
      dailyWorkSeconds: DAILY_WORK_SECONDS,
    };
  }


  private nextType(last?: TimeEntryType) {
    if (!last) return TimeEntryType.IN;

    switch (last) {
      case TimeEntryType.IN:
        return TimeEntryType.BREAK_START;
      case TimeEntryType.BREAK_START:
        return TimeEntryType.BREAK_END;
      case TimeEntryType.BREAK_END:
        return TimeEntryType.OUT;
      case TimeEntryType.OUT:
        throw new BadRequestException("Jornada já encerrada");
      default:
        throw new BadRequestException("Tipo inválido");
    }
  }
}
