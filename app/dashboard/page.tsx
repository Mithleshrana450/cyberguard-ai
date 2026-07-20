import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import StatCards from "@/components/dashboard/StatCards";
import { TrafficChart, CategoryChart } from "@/components/dashboard/Charts";
import AlertsTable from "@/components/dashboard/AlertsTable";
import AuditLog from "@/components/dashboard/AuditLog";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <main className="space-y-6 p-6">
          <StatCards />

          <div className="grid gap-6 lg:grid-cols-2">
            <TrafficChart />
            <CategoryChart />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AlertsTable />
            <AuditLog />
          </div>
        </main>
      </div>
    </div>
  );
}
