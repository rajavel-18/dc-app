import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { users, userRoles, roles } from '../../database/schema';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DRIZZLE') private db: any,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;

    // fetch roles
    const roleRows = await this.db.select().from(userRoles).where(eq(userRoles.userId, user.id));
    let roleNames: string[] = [];
    if (roleRows.length) {
      const roleIds = roleRows.map((r) => r.roleId);
      const rs = await this.db.select().from(roles).where(inArray(roles.id, roleIds));
      roleNames = rs.map((r) => r.name);
    }

    // return what we want to put into JWT
    return { id: user.id, email: user.email, roles: roleNames, fullName: user.fullName };
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, roles: user.roles || [] };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(dto: { email: string; password: string; fullName?: string; roles: string[] }) {
    // ensure unique email
    const existing = await this.db.select().from(users).where(eq(users.email, dto.email));
    if (existing.length) {
      throw new UnauthorizedException('Email already registered');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const [created] = await this.db.insert(users).values({
      email: dto.email,
      password: hash,
      fullName: dto.fullName ?? null,
      isActive: true,
    }).returning();

    // ensure roles exist; create if missing
    for (const roleName of dto.roles || []) {
      let [roleRow] = await this.db.select().from(roles).where(eq(roles.name, roleName));
      if (!roleRow) {
        [roleRow] = await this.db.insert(roles).values({ name: roleName }).returning();
      }
      await this.db.insert(userRoles).values({ userId: created.id, roleId: roleRow.id });
    }

    return { id: created.id, email: created.email, fullName: created.fullName, roles: dto.roles };
  }
}