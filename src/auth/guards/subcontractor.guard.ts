import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SubcontractorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Only subcontractors can access
    if (user.userType !== 'subcontractor') {
      throw new ForbiddenException('Only subcontractors can perform this action');
    }

    return true;
  }
}
