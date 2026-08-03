import { useEffect } from "react";
import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

import { reportLovableError } from "@/lib/lovable-error-reporting";
import { errorMessage } from "@/lib/async-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Route-level error boundary fallback. Registered as the router's
 * defaultErrorComponent so every page route degrades gracefully
 * instead of rendering a blank screen.
 */
export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "route_error_boundary" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">This page didn&apos;t load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {errorMessage(error, "Something went wrong on our end.")}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/dashboard">
              <Home className="h-4 w-4" /> Go to dashboard
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function RouteNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6 text-center">
        <h1 className="text-5xl font-bold text-foreground">404</h1>
        <h2 className="mt-3 text-lg font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-5 flex justify-center">
          <Button asChild className="gap-2">
            <Link to="/dashboard">
              <Home className="h-4 w-4" /> Go to dashboard
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
