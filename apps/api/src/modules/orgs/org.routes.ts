import { Router } from 'express';
import { orgController } from './org.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireOrgRole, requireOrgMembership } from '../../middlewares/role.middleware';
import { OrgRole } from '@prisma/client';

const router = Router();

// All org routes require authentication
router.use(authMiddleware);

// Create org (any authenticated user)
router.post('/', orgController.createOrg.bind(orgController));

// Get current user's primary org
router.get('/me', orgController.getMyOrg.bind(orgController));

// Get org details (requires membership)
router.get('/:orgId', requireOrgMembership(), orgController.getOrgDetails.bind(orgController));

// Update org (requires OWNER role)
router.put('/:orgId', requireOrgRole(OrgRole.OWNER), orgController.updateOrg.bind(orgController));

export default router;

