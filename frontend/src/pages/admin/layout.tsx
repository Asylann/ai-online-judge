import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { AdminLayout } from "@/components/AdminLayout";

export { AdminLayout };

export default function AdminLayoutPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/problems");
  }, [router]);

  return (
    <AdminLayout title="Redirecting..." subtitle="Redirecting to Admin Problem Dashboard">
      <div className="p-12 text-center text-slate-500 font-mono text-sm">
        Navigating to /admin/problems...
      </div>
    </AdminLayout>
  );
}
