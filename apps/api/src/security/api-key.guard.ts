import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.API_KEY;

    // Never silently disable the guard because a deployment variable is missing.
    if (!expected || expected === 'change-me' || expected.startsWith('replace-with-')) {
      throw new InternalServerErrorException(
        'API_KEY must be configured with a non-default secret before the API can be used',
      );
    }

    const request = context.switchToHttp().getRequest();
    const raw = request.headers['x-api-key'] ?? request.headers['authorization'];
    const provided = Array.isArray(raw) ? raw[0] : raw;

    if (!provided) {
      throw new UnauthorizedException('API key is required');
    }

    const normalized = provided.trim();
    const valid =
      normalized === expected ||
      normalized === `Bearer ${expected}` ||
      normalized === `bearer ${expected}`;

    if (!valid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
