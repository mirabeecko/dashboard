import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { google } from 'googleapis';

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
      refresh_token: token.refreshToken as string | undefined,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    return {
      ...token,
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date
        ? Math.floor(credentials.expiry_date / 1000)
        : Math.floor(Date.now() / 1000) + 3600,
      refreshToken: credentials.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/analytics.readonly',
            'https://www.googleapis.com/auth/analytics',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        return {
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }

      // Return previous token if the access token has not expired yet
      // (with 60s buffer)
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000 - 60000) {
        return token;
      }

      // Access token has expired, try to refresh it
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.expiresAt = token.expiresAt as number | undefined;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};
