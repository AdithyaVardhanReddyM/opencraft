"use client";

import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { ProjectFilters } from "@/components/dashboard/ProjectFilters";
import { ProjectSortOption } from "@/types/project";
import { Separator } from "@/components/ui/separator";

interface DashboardHeaderProps {
  sortBy: ProjectSortOption;
  onSortChange: (sort: ProjectSortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function DashboardHeader({
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}: DashboardHeaderProps) {
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

          {/* User Button from Clerk */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-9",
              },
            }}
          />
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
