import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6">
        <Link
          href="/sessions"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Sessions
        </Link>
        <div className="flex items-center space-x-3">
          <Home className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          View full details for this practice session including participants, location,
          time, focus areas, and more. Session ID: <code className="bg-gray-100 px-2 py-1 rounded">{params.id}</code>
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            🚧 This page is under construction. Session details view coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

