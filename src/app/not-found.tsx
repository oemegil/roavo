import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-1 items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>This page is not available</CardTitle>
          <CardDescription>
            The link may be outdated, or the page has not been built yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-small text-muted-foreground">
            Head back to the home screen to continue exploring Roavo.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/">Back to Roavo</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
