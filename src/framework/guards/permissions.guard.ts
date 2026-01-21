import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const routePermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    const user = context.getArgs()[0].user;
    const isAdmin = user.roles.map((role) => role.name == 'Super Admin');

    if (!routePermissions?.length || isAdmin) {
      return true;
    }


    const hasPermission = () =>
      routePermissions.every((routePermission) =>
        user.permissions.includes(routePermission),
      );

    return hasPermission();
  }
}
