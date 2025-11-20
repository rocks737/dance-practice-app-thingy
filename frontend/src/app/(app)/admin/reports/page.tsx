import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminReportsPage() {
  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Abuse Reports</h1>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground mb-4">
            Review and handle abuse reports from users. Manage content moderation, user
            safety concerns, and take appropriate actions.
          </p>
          <Alert className="mt-4">
            <AlertDescription>
              🚧 This page is under construction. Report management features coming soon!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

