import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return { ok: false, status: 401, message: 'Unauthorized' };
    }
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()) || [];
    if (!adminEmails.includes(session.user.email)) {
        return { ok: false, status: 403, message: 'Forbidden' };
    }
    return { ok: true, session };
}
