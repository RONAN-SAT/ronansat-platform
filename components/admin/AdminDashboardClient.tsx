"use client";

import { useState } from "react";

import AdminActionDialog from "@/components/admin/AdminActionDialog";
import InitialTabBootReady from "@/components/InitialTabBootReady";
import RoleManagementPanel from "@/components/admin/RoleManagementPanel";
import CreateStudentForm from "@/components/admin/CreateStudentForm";
import TestQuestionManagementPanel from "@/components/admin/TestQuestionManagementPanel";

type AdminActionKey = "roles" | "tests" | "hall-of-fame" | null;

export default function AdminDashboardClient() {
  const [openAction, setOpenAction] = useState<AdminActionKey>(null);

  const actions = [
    {
      key: "roles" as const,
      title: "Manage Roles",
      description: "Create roles, update role permissions, and add people to roles. Default roles stay protected.",
    },
    {
      key: "tests" as const,
      title: "Tests & Questions",
      description: "Create a test, choose an existing test, then add questions manually or with JSON.",
    },
    {
      key: "hall-of-fame" as const,
      title: "Add Hall of Fame Student",
      description: "Save a standout score with the student photo and score details.",
    },
  ];

  return (
    <div className="min-h-screen bg-paper-bg p-8 pb-24">
      <InitialTabBootReady />
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="workbook-panel-muted overflow-hidden">
          <div className="border-b-4 border-ink-fg bg-paper-bg px-6 py-5">
            <h1 className="font-display text-4xl font-black uppercase tracking-tight text-ink-fg">Admin Settings</h1>
            <p className="mt-3 max-w-3xl text-sm text-ink-fg/70">
              Keep the page simple: click a setting, work in the pop-up, then close it when you are done.
            </p>
          </div>
        </section>

        <section className="workbook-panel overflow-hidden">
          <div className="border-b-4 border-ink-fg bg-paper-bg px-6 py-5">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-ink-fg">Actions</h2>
          </div>

          <div className="divide-y-2 divide-ink-fg">
            {actions.map((action) => {
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => setOpenAction(action.key)}
                  className="flex w-full items-center justify-between gap-4 bg-surface-white px-6 py-5 text-left transition-colors hover:bg-paper-bg active:translate-x-0.5 active:translate-y-0.5"
                >
                  <div>
                    <div className="text-lg font-black text-ink-fg">{action.title}</div>
                    <p className="mt-1 max-w-2xl text-sm text-ink-fg/70">{action.description}</p>
                  </div>

                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-ink-fg/55">Open</div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <AdminActionDialog
        open={openAction === "roles"}
        onClose={() => setOpenAction(null)}
        title="Manage Roles"
        description="Only admin users can create roles, edit role permissions, and add people to roles. Default roles stay protected."
        size="wide"
      >
        <RoleManagementPanel embedded />
      </AdminActionDialog>

      <AdminActionDialog
        open={openAction === "tests"}
        onClose={() => setOpenAction(null)}
        title="Tests & Questions"
        description="Create a workbook shell, then add questions to a new or existing test."
        size="wide"
      >
        <TestQuestionManagementPanel />
      </AdminActionDialog>

      <AdminActionDialog
        open={openAction === "hall-of-fame"}
        onClose={() => setOpenAction(null)}
        title="Add Hall of Fame Student"
        description="Save standout student results from this pop-up instead of the main admin page."
      >
        <CreateStudentForm embedded />
      </AdminActionDialog>
    </div>
  );
}
