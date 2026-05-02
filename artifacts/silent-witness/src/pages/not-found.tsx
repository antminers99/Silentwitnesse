import { Link } from "wouter";
import { Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-serif text-primary tracking-tight">Page Not Found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This page does not exist. It may have been moved or the link may be incorrect.
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <Button asChild size="sm">
            <Link href="/">
              <Shield className="w-4 h-4 mr-2" />
              Return to Silent Witness
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/records">View Public Registry</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
