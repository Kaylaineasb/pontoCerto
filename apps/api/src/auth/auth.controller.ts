import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/role.decorator';
import type { Request } from "express";

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService){}

    @Post('login')
    login(@Body() dto: LoginDto){
        return this.auth.login(dto);
    }

    @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@Req() req: Request) {
    const user = req.user as any;

    const userId = user.sub ?? user.userId ?? user.id;
    const orgId = user.orgId;

    return this.auth.me(userId, orgId);
  }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin-only')
    adminOnly(){
        return {ok:true, message: 'Você é admin!'}
    }
}
