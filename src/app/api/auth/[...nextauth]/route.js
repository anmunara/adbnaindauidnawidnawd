import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth } from "@/lib/firebaseAdmin";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {},
            async authorize(credentials) {
                const { idToken } = credentials;
                if (!idToken) return null;

                try {
                    if (!adminAuth) {
                        return null;
                    }
                    // Verify the ID token using Firebase Admin
                    const decodedToken = await adminAuth.verifyIdToken(idToken);
                    if (decodedToken) {
                        return {
                            id: decodedToken.uid,
                            email: decodedToken.email,
                            name: decodedToken.name || decodedToken.email // Fallback to email if name is missing
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("Error verifying Firebase token:", error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: '/', // Redirect back to homepage/login page on error
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
