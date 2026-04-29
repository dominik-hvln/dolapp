import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthService } from './auth.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'message-id' }),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let config: { get: jest.Mock };
  let supabaseClient: any;
  let supabaseAdminClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          SMTP_USER: 'smtp-user',
          SMTP_PASS: 'smtp-pass',
          SMTP_HOST: 'smtp.example.com',
          SMTP_PORT: '587',
          MAIL_FROM: '"Dolapp" <no-reply@example.com>',
          APP_URL: 'https://app.example.com',
          BACKEND_URL: 'https://api.example.com',
        };
        return values[key];
      }),
    };

    supabaseClient = {
      from: jest.fn((table: string) => {
        if (table === 'companies') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'company-id' }, error: null }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    supabaseAdminClient = {
      auth: {
        admin: {
          generateLink: jest.fn().mockResolvedValue({
            data: {
              user: { id: 'user-id' },
              properties: {
                action_link: 'https://supabase.example.com/auth/v1/verify?token=signup-token',
              },
            },
            error: null,
          }),
          deleteUser: jest.fn(),
        },
      },
      from: jest.fn((table: string) => {
        if (table === 'users') {
          return {
            upsert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
        throw new Error(`Unexpected admin table: ${table}`);
      }),
    };

    const supabaseService = {
      getClient: jest.fn(() => supabaseClient),
      getAdminClient: jest.fn(() => supabaseAdminClient),
    } as unknown as SupabaseService;

    service = new AuthService(
      supabaseService,
      {} as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('returns from register without waiting for SMTP delivery', async () => {
    jest.spyOn(service as any, 'sendSmtpEmail').mockImplementation(() => new Promise(() => undefined));

    const resultPromise = service.register({
      email: 'employee@example.com',
      password: 'password123',
      firstName: 'Jan',
      lastName: 'Kowalski',
      phone: '+48123456789',
      companyCode: 'A3K7BX9R',
    });

    const raceResult = await Promise.race([
      resultPromise.then((result) => result),
      new Promise((resolve) => setImmediate(() => resolve('still-waiting'))),
    ]);

    expect(raceResult).toEqual({
      message: 'Rejestracja udana. Sprawdź e-mail, a potem poczekaj na aktywację przez administratora.',
    });
  });

  it('configures short SMTP timeouts', async () => {
    await (service as any).sendSmtpEmail(
      'user@example.com',
      'Subject',
      '<p>Hello</p>',
      'Hello',
    );

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
        dnsTimeout: 10000,
      }),
    );
  });
});
