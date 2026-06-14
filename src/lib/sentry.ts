import * as Sentry from "@sentry/react";

export function initSentry() {
  Sentry.init({
    dsn: "https://06c85e31328e18217335016ad831158e@o4511101518544896.ingest.us.sentry.io/4511395861561344",
    integrations: [],
    tracesSampleRate: 0,
    defaultIntegrations: false,
    environment: import.meta.env.DEV ? "development" : "production",
  });
}

export { Sentry };
