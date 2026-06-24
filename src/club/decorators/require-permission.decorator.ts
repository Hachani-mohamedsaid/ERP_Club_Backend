import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'club_permission';

export const RequirePermission = (
  module: string,
  action: 'read' | 'create' | 'update' | 'delete',
) => SetMetadata(PERMISSION_KEY, { module, action });
