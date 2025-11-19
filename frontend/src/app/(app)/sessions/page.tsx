import { Home, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SessionsPage() {
  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Home className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
        </div>
        <Link href="/sessions/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Session
          </Button>
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          Browse upcoming practice sessions, join sessions that match your schedule,
          or create your own practice sessions to invite others.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            🚧 This page is under construction. Session browsing and management features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

