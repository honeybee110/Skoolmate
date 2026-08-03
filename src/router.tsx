import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { RouteErrorBoundary, RouteNotFound } from "./components/route-error";

function isClientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    /\b(400|401|403|404|409|422)\b/.test(message) ||
    message.includes("unauthor") ||
    message.includes("forbidden") ||
    message.includes("permission")
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Bounded retries with backoff; auth/validation failures fail fast.
        retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        staleTime: 30_000,
      },
      mutations: { retry: 0 },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Every route inherits an error boundary + 404 fallback — no blank screens.
    defaultErrorComponent: RouteErrorBoundary,
    defaultNotFoundComponent: RouteNotFound,
  });

  return router;
};
