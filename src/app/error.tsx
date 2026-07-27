"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>We couldn&apos;t load this part of Roavo</CardTitle>
          <CardDescription>
            Something interrupted this screen. Your data should be safe — try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-caption">
            If this keeps happening, refresh the page or come back in a moment.
          </p>
        </CardContent>
        <CardFooter>
          <Button type="button" onClick={reset}>
            Try again
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
