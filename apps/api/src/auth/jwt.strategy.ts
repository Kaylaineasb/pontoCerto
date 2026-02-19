import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

type JwtPayload = {
  sub: string;
  orgId: string;
  role: "ADMIN" | "EMPLOYEE";
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(config: ConfigService,private prisma: PrismaService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('JWT_SECRET','dev-secret'),
        });
    }

    async validate(payload: JwtPayload) {
    // 1) valida payload mínimo
    if (!payload?.sub || !payload?.orgId) {
      throw new UnauthorizedException("Token inválido");
    }

    // 2) busca usuário real no banco e valida status + org
    const user = await this.prisma.prisma.users.findFirst({
      where: { id: payload.sub, orgId: payload.orgId, isActive: true },
      select: {
        id: true,
        orgId: true,
        role: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Usuário inválido ou inativo");
    }

    return {
      sub: user.id,
      orgId: user.orgId,
      role: user.role,
      email: user.email,
      name: user.name,
    };
  }
}