import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "bg-white shadow-2xl shadow-primary/10",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "bg-white border-border hover:bg-accent text-foreground",
          formFieldLabel: "text-foreground",
          formFieldInput:
            "bg-white border-border text-foreground focus:border-primary focus:ring-primary/40",
          footerActionLink: "text-primary hover:text-primary/80",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
        },
      }}
    />
  );
}
