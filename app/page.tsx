import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { AppointmentsTable } from "@/components/dashboard/appointments-table";
import { AIActivityFeed } from "@/components/dashboard/ai-activity-feed";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Stats Cards */}
            <StatsCards />

            {/* Two Column Layout */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Appointments Table - Takes 2 columns */}
              <div className="lg:col-span-2">
                <AppointmentsTable />
              </div>

              {/* AI Activity Feed - Takes 1 column */}
              <div className="lg:col-span-1">
                <AIActivityFeed />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

