import { Shield, Users, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminPage() {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-8 h-8 text-destructive" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">---</p>
              </div>
              <Users className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">---</p>
              </div>
              <Home className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
                <p className="text-2xl font-bold">---</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/users"
              className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <Users className="w-6 h-6 mb-2" />
              <h3 className="font-medium">Manage Users</h3>
              <p className="text-sm text-muted-foreground">
                View and manage user accounts
              </p>
            </Link>
            <Link
              href="/admin/reports"
              className="p-4 border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <AlertTriangle className="w-6 h-6 mb-2" />
              <h3 className="font-medium">Review Reports</h3>
              <p className="text-sm text-muted-foreground">
                Handle abuse reports and moderation
              </p>
            </Link>
          </div>

          <Alert className="mt-6">
            <AlertDescription>
              🚧 Admin features are under construction. Full functionality coming soon!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
