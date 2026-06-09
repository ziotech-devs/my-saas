import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";

import { MailService } from "../mail/mail.service";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";

const createTestUser = (overrides = {}) => ({
  id: "user-1",
  name: "Test User",
  picture: null,
  username: "testuser",
  email: "test@example.com",
  locale: "en-US",
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  provider: "email",
  secrets: {
    id: "secret-1",
    password: "hashed",
    lastSignedIn: new Date(),
    verificationToken: null,
    twoFactorSecret: null,
    twoFactorBackupCodes: [],
    refreshToken: null,
    resetToken: null,
    userId: "user-1",
  },
  ...overrides,
});

describe("AuthService", () => {
  let authService: AuthService;

  const findOneByIdentifier = jest.fn();
  const updateByEmail = jest.fn();
  const sendEmail = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: { findOneByIdentifier, updateByEmail } },
        { provide: MailService, useValue: { sendEmail } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue("https://app.example.com") },
        },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  describe("when requesting a password reset", () => {
    it("should send a reset email for a registered user with secrets", async () => {
      // Arrange
      const user = createTestUser();
      findOneByIdentifier.mockResolvedValue(user);

      // Act
      await authService.forgotPassword(user.email);

      // Assert
      expect(updateByEmail).toHaveBeenCalledWith(
        user.email,
        expect.objectContaining({
          secrets: { update: { resetToken: expect.any(String) } },
        }),
      );
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    });

    it("should not throw or send email when the email is not registered", async () => {
      // Arrange
      findOneByIdentifier.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.forgotPassword("unknown@example.com")).resolves.toBeUndefined();
      expect(updateByEmail).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("should not throw or send email for an OAuth user without a secrets row", async () => {
      // Arrange
      const oauthUser = createTestUser({ provider: "google", secrets: null });
      findOneByIdentifier.mockResolvedValue(oauthUser);

      // Act & Assert
      await expect(authService.forgotPassword(oauthUser.email)).resolves.toBeUndefined();
      expect(updateByEmail).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });
});
