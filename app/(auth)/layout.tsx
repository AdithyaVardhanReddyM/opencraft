import { ReactNode } from "react";
import Image from "next/image";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Full-page decorative background */}
      <Image
        src="/auth_decor.jpg"
        alt=""
        fill
        priority
        className="object-cover"
      />
      {/* Soft wash to keep the foreground readable */}
      <div className="absolute inset-0 bg-white/20" />

      {/* Centered auth form */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
