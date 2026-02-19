import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private jwt: JwtService){}

    async login(dto: LoginDto){
        const user = await this.prisma.prisma.users.findFirst({
            where: {
                email: dto.email,
                isActive: true,
            },
            include: {organization: true},
        });

        if(!user) throw new UnauthorizedException('Credenciais inválidas!');

        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if(!ok) throw new UnauthorizedException('Credenciais inválidas!');

        const payload = {
            sub: user.id,
            orgId: user.orgId,
            role: user.role,
        };

        const accessToken = await this.jwt.signAsync(payload);

        return{
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                orgId: user.orgId,
                organization: {
                    id: user.organization.id,
                    name: user.organization.name,
                    timezone: user.organization.timezone
                }
            }
        }

    }

    async me(userId: string, orgId?: string) {
    const user = await this.prisma.prisma.users.findFirst({
      where: {
        id: userId,
        ...(orgId ? { orgId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        orgId: true,
        organization: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException("Usuário não encontrado.");

    return user;
  }
}
