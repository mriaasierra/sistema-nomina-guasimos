"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-60"
        style={{
          background:
            "radial-gradient(900px 500px at 78% -10%, rgba(249,115,22,0.09), transparent 60%), radial-gradient(700px 500px at 8% 100%, rgba(30,64,175,0.20), transparent 60%)",
        }}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="relative z-10 lg:pl-[272px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
