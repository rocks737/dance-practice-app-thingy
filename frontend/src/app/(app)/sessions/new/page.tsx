import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewSessionPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/sessions"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Sessions
        </Link>
        <div className="flex items-center space-x-3">
          <Plus className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Create New Session</h1>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Create a new practice session by filling in details like date, time, location,
          session type, and capacity. Other dancers can then join your session.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            🚧 This page is under construction. Session creation form coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

