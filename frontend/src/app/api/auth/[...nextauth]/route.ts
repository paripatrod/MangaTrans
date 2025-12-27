import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "select_account",  // Force account selection
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // For demo purposes, accept any credentials
                // In production, verify against your database
                if (credentials?.email && credentials?.password) {
                    return {
                        id: credentials.email,
                        email: credentials.email,
                        name: credentials.email.split("@")[0],
                    };
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user, account, profile }) {
            if (user) {
                token.id = user.id;
            }
            if (account) {
                token.provider = account.provider;
            }
            // Get Google profile picture
            if (profile && account?.provider === "google") {
                token.picture = (profile as { picture?: string }).picture;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.id as string;
                // Pass picture to session
                if (token.picture) {
                    session.user.image = token.picture as string;
                }
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
