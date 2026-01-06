import { ReactNode } from "react";
import AdminGuard from "@/app/components/admin/AdminGuard";
import AdminShell from "@/app/components/admin/AdminShell";


export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}