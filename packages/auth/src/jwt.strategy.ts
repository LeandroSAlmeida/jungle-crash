import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

export interface AuthenticatedPlayer {
  playerId: string;
  username?: string;
}

interface KeycloakTokenPayload {
  sub: string;
  preferred_username?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const issuer = process.env.KEYCLOAK_ISSUER ?? '';
    const jwksUri = process.env.KEYCLOAK_JWKS_URI ?? `${issuer}/protocol/openid-connect/certs`;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        jwksUri,
        cache: true,
        rateLimit: true,
      }),
      issuer,
      algorithms: ['RS256'],
    });
  }

  validate(payload: KeycloakTokenPayload): AuthenticatedPlayer {
    return { playerId: payload.sub, username: payload.preferred_username };
  }
}
