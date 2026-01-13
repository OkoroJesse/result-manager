import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        if (!(req as any).role) {
            res.status(403).json({ error: 'Access Denied: No role assigned' });
            return;
        }

        if (!allowedRoles.includes((req as any).role)) {
            res.status(403).json({
                error: `Access Denied: Requires one of [${allowedRoles.join(', ')}]`
            });
            return;
        }

        next();
    };
};
