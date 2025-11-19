import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

export default function AdminUsersPage() {
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
          <Users className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          View all users, manage their accounts, assign roles, and handle user-related
          administrative tasks.
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            🚧 This page is under construction. User management features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}

