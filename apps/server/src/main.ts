import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import { patchNestJsSwagger } from "nestjs-zod";

import { AppModule } from "./app.module";
import type { Config } from "./config/schema";

patchNestJsSwagger();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: process.env.NODE_ENV === "development" ? ["debug"] : ["error", "warn", "log"],
    rawBody: true, // Required for Stripe webhook signature verification
  });

  const configService = app.get(ConfigService<Config>);

  const accessTokenSecret = configService.getOrThrow("ACCESS_TOKEN_SECRET");
  const publicUrl = configService.getOrThrow("PUBLIC_URL");
  const isHTTPS = publicUrl.startsWith("https://") ?? false;

  // Cookie Parser
  app.use(cookieParser());

  // Session
  app.use(
    session({
      resave: false,
      saveUninitialized: false,
      secret: accessTokenSecret,
      cookie: { httpOnly: true, secure: isHTTPS },
    }),
  );

  // CORS
  app.enableCors({ credentials: true, origin: isHTTPS });

  // Helmet - enabled only in production
  if (isHTTPS) app.use(helmet({ contentSecurityPolicy: false }));

  // Proxy /api/graphs/* → LangGraph service
  // Express strips the /api/graphs mount path before forwarding, so no pathRewrite needed
  const graphsUrl = configService.getOrThrow<string>("GRAPHS_URL");
  app.use(
    "/api/graphs",
    createProxyMiddleware({
      target: graphsUrl,
      changeOrigin: true,
      on: {
        error: (err, _req, res) => {
          Logger.error(`Graphs proxy error: ${(err as Error).message}`, "GraphsProxy");
          if (!(res as import("http").ServerResponse).headersSent) {
            (res as import("express").Response).status(502).json({ message: "Graphs service unavailable" });
          }
        },
      },
    }),
  );

  // Global Prefix
  const globalPrefix = "api";
  app.setGlobalPrefix(globalPrefix);

  // Enable Shutdown Hooks
  app.enableShutdownHooks();

  // Swagger (OpenAPI Docs)
  // This can be accessed by visiting {SERVER_URL}/api/docs
  const config = new DocumentBuilder()
    .setTitle("My SaaS")
    .setDescription(
      "My SaaS is a free and open source SaaS boilerplate that's built to make the mundane tasks of creating, updating and sharing your SaaS as easy as 1, 2, 3.",
    )
    .addCookieAuth("Authentication", { type: "http", in: "cookie", scheme: "Bearer" })
    .setVersion("4.0.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  // Port
  const port = configService.get<number>("PORT") ?? 3000;

  await app.listen(port);

  Logger.log(`🚀 Server is up and running on port ${port}`, "Bootstrap");
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void bootstrap();
