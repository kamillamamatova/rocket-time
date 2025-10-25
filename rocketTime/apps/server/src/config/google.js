import { google } from 'googleapis';
import 'dotenv/config';

export const getOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );
  return oauth2Client;
};

export const calendarForUser = async (tokens) => {
  // tokens: { access_token, refresh_token, expiry_date }
  const auth = getOAuth2Client();
  auth.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth });
};
