import { Sidebar } from "@/components/sidebar";
import { MobileFooter } from "@/components/mobile-footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <MobileFooter />
      </div>
    </div>
  );
}
