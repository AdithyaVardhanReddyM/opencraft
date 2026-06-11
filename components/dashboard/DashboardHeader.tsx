"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ProjectFilters } from "@/components/dashboard/ProjectFilters";
import { ProjectSortOption } from "@/types/project";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "../mode-toggle";

interface DashboardHeaderProps {
  sortBy: ProjectSortOption;
  onSortChange: (sort: ProjectSortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TABS = [
  { id: "your-projects", label: "Your Projects" },
  { id: "shared-with-you", label: "Shared with You" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DashboardHeader({
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}: DashboardHeaderProps) {
  const [activeTab, setActiveTab] = useState<TabId>("your-projects");

  return (
    <header className="bg-accent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/unitset_fulllogo.svg"
              alt="Unit {set}"
              width={140}
              height={36}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* Center Tabs */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="flex h-10 items-center bg-muted/30 backdrop-blur-2xl saturate-150 border border-border/20 shadow-sm rounded-full p-1 gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative z-10 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="dashboard-active-tab"
                      className="absolute inset-0 bg-background/60 dark:bg-white/8 backdrop-blur-sm rounded-full -z-10 shadow-xs ring-1 ring-white/10 dark:ring-white/10"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                  <span
                    className={
                      activeTab === tab.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* <ModeToggle /> */}

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "ring-2 ring-primary",
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Separator with spacing */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Separator className="bg-border/40" />
      </div>

      {/* Projects Section with Search and Filters */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProjectFilters
          sortBy={sortBy}
          onSortChange={onSortChange}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>
    </header>
  );
}
