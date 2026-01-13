import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Extend Request type to avoid TS errors in this file if global augmentation is tricky
interface AuthRequest extends Request {
    user?: any;
    role?: string;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            res.status(401).json({ error: 'Unauthorized: Invalid token' });
            return;
        }

        // Fetch user profile and role from public.users
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role_id, roles(name)')
            .eq('id', user.id)
            .maybeSingle();

        let userProfile = profile;

        if (!userProfile) {
            console.log(`Auto-repairing missing profile for: ${user.email}`);
            // 1. Identify Role
            const { data: roles } = await supabase.from('roles').select('id, name');
            const teacherRole = roles?.find(r => r.name === 'teacher');
            const adminRole = roles?.find(r => r.name === 'admin');
            const studentRole = roles?.find(r => r.name === 'student');

            let assignedRoleId = studentRole?.id;
            let firstName = 'User';
            let lastName = 'Member';

            // 2. Check if Teacher (by email)
            const { data: teacher } = await supabase
                .from('teachers')
                .select('id, first_name, last_name')
                .eq('email', user.email)
                .maybeSingle();

            if (teacher) {
                assignedRoleId = teacherRole?.id;
                firstName = teacher.first_name;
                lastName = teacher.last_name;
            } else if (user.email === 'jessechinedu822@gmail.com') {
                assignedRoleId = adminRole?.id;
                firstName = 'Jesse';
                lastName = 'Admin';
            }

            // 3. Create Public Profile
            const { data: newProfile, error: createError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email,
                    first_name: firstName,
                    last_name: lastName,
                    role_id: assignedRoleId
                })
                .select('role_id, roles(name)')
                .single();

            if (createError) {
                console.error('Failed to auto-repair profile:', createError);
                res.status(403).json({ error: 'Access Denied: User profile could not be synchronized' });
                return;
            }

            // 4. Link Teacher if applicable
            if (teacher) {
                await supabase.from('teachers').update({ auth_user_id: user.id }).eq('id', teacher.id);
            }

            userProfile = newProfile;
        }

        (req as any).user = user;
        // @ts-ignore - Supabase join returns nested object
        (req as any).role = userProfile.roles?.name || 'student';

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
