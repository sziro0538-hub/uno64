"use client";


import AdminSidebar from "./AdminSidebar";


export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />


      {/* Content */}
      <main className="flex-1 ml-64 p-6">
        {children}
      </main>
    </div>
  );
}