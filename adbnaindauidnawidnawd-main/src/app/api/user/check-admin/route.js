import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return Response.json({ isAdmin: false });
        }

        // Server-side check using private env var
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
        const isAdmin = adminEmails.includes(session.user.email);

        return Response.json({ isAdmin });
    } catch (error) {
        console.error('Error checking admin status:', error);
        return Response.json({ isAdmin: false }, { status: 500 });
    }
}
