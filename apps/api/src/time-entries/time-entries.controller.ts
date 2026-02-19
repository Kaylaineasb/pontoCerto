import { Body, Controller, Post, Req, UseGuards, Get, Query, Param, Res, NotFoundException, StreamableFile } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TimeEntriesService } from "./time-entries.service";
import { CreateTimeEntryDto } from "./dto/create-time-entry.dto";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProduces, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { z } from "zod";

@UseGuards(JwtAuthGuard)
@ApiTags("Time Entries")
@ApiBearerAuth()
@Controller("time-entries")
export class TimeEntriesController {
  constructor(private service: TimeEntriesService) { }

  @Post()
  create(@Req() req: any, @Body() dto: CreateTimeEntryDto) {
    return this.service.create(req.user.userId, req.user.orgId, dto);
  }

  @Get("today")
  today(@Req() req: any) {
    return this.service.getToday(req.user.userId, req.user.orgId);
  }

  @ApiOperation({ summary: "Histórico por período" })
  @ApiQuery({ name: "from", required: true, example: "2026-02-01" })
  @ApiQuery({ name: "to", required: true, example: "2026-02-28" })
  @Get()
  async list(
    @CurrentUser() user: { sub: string; orgId: string },
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    const schema = z.object({
      from: z.string().min(10),
      to: z.string().min(10),
    });
    schema.parse({ from, to });

    return this.service.listByPeriod(user.sub, user.orgId, from, to);
  }

  @ApiOperation({ summary: "Baixar foto da batida (selfie)" })
  @ApiParam({
    name: "id",
    description: "ID do TimeEntry",
    example: "83dd8dc4-07ef-4562-b376-eadee3213e11",
  })
  @ApiProduces("image/jpeg", "image/png", "image/webp")
  @ApiResponse({
    status: 200,
    description: "Imagem da selfie (binário)",
    content: {
      "image/jpeg": { schema: { type: "string", format: "binary" } },
      "image/png": { schema: { type: "string", format: "binary" } },
      "image/webp": { schema: { type: "string", format: "binary" } },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Foto não encontrada / sem foto" })
  @Get(":id/photo")
  async getPhoto(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const photo = await this.service.getPhoto(user.sub, user.orgId, id);

    if (!photo) {
      throw new NotFoundException("Foto não encontrada");
    }

    if (!photo?.photoBase64) {
      throw new NotFoundException("Esta batida não tem foto.");
    }

    const buffer = Buffer.from(photo.photoBase64, "base64");

    return new StreamableFile(buffer, {
      type: photo.photoMime ?? "image/jpeg",
    });
  }

  @ApiOperation({ summary: "Histórico de um dia com evidências (foto + GPS)" })
  @Get(":date")
  async getByDate(
    @CurrentUser() user: { sub: string; orgId: string },
    @Param("date") date: string, // YYYY-MM-DD
  ) {
    // validação simples
    const schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
    schema.parse(date);

    return this.service.getByDate(user.sub, user.orgId, date);
  }

}
