import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminReportsPage() {
  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Abuse Reports</h1>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          Review and handle abuse reports from users. Manage content moderation, user
          safety concerns, and take appropriate actions.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            🚧 This page is under construction. Report management features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

