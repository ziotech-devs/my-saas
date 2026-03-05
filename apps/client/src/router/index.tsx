import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from "react-router";

import { BackupOtpPage } from "../pages/auth/backup-otp/page";
import { ForgotPasswordPage } from "../pages/auth/forgot-password/page";
import { AuthLayout } from "../pages/auth/layout";
import { LoginPage } from "../pages/auth/login/page";
import { RegisterPage } from "../pages/auth/register/page";
import { ResetPasswordPage } from "../pages/auth/reset-password/page";
import { VerifyEmailPage } from "../pages/auth/verify-email/page";
import { VerifyOtpPage } from "../pages/auth/verify-otp/page";
import { AgentChatPage } from "../pages/dashboard/agent-chat/page";
import { BillingPage } from "../pages/dashboard/billing/page";
import { DashboardLayout } from "../pages/dashboard/layout";
import { SettingsPage } from "../pages/dashboard/settings/page";
import { AboutPage } from "../pages/home/about/page";
import { ContactPage } from "../pages/home/contact/page";
import { DocsPage } from "../pages/home/docs/page";
import { HomeLayout } from "../pages/home/layout";
import { PricingPage } from "../pages/home/pricing/page";
import { PrivacyPolicyPage } from "../pages/home/privacy-policy/page";
import { SupportPage } from "../pages/home/support/page";
import { TermsPage } from "../pages/home/terms/page";
import { HomePage } from "../pages/home/page";
import { ErrorPage } from "../pages/public/error";
import { Providers } from "../providers";
import { AuthGuard } from "./guards/auth";
import { GuestGuard } from "./guards/guest";
import { authLoader } from "./loaders/auth";

export const routes = createRoutesFromElements(
  <Route element={<Providers />}>
    <Route errorElement={<ErrorPage />}>
      <Route element={<HomeLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsPage />} />
      </Route>

      <Route path="auth">
        <Route element={<AuthLayout />}>
          <Route element={<GuestGuard />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          {/* Password Recovery */}
          <Route element={<GuestGuard />}>
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Two-Factor Authentication */}
          <Route element={<GuestGuard />}>
            <Route path="verify-otp" element={<VerifyOtpPage />} />
            <Route path="backup-otp" element={<BackupOtpPage />} />
          </Route>

          {/* Email Verification */}
          <Route element={<AuthGuard />}>
            <Route path="verify-email" element={<VerifyEmailPage />} />
          </Route>

          {/* OAuth Callback */}
          <Route path="callback" loader={authLoader} element={<div />} />
        </Route>

        <Route index element={<Navigate replace to="/auth/login" />} />
      </Route>

      <Route path="dashboard">
        <Route element={<AuthGuard />}>
          <Route element={<DashboardLayout />}>
            <Route path="billing" element={<BillingPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="agent-chat" element={<AgentChatPage />} />

            <Route index element={<BillingPage />} />
          </Route>
        </Route>
      </Route>
    </Route>
  </Route>,
);

export const router = createBrowserRouter(routes);
