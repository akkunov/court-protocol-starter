import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'] ?? req.headers['authorization'];

    const expected = process.env.API_KEY;

    if (!expected) {
      return true;
    }

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const valid = Array.isArray(apiKey)
      ? apiKey.includes(expected)
      : apiKey === expected || apiKey === `Bearer ${expected}` || apiKey === `bearer ${expected}`;

    if (!valid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}

