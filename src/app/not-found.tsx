import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center bg-[#0A0A0A] px-4 py-24">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="mx-auto size-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-8">
          <FileQuestion className="size-10 text-white/40" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            404
          </h1>
          <h2 className="text-xl font-medium text-white/80">
            Page not found
          </h2>
          <p className="text-base text-white/50">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="pt-6">
          <Link href="/" className={buttonVariants({ variant: "outline", className: "h-12 px-6" })}>
            <Home className="mr-2 size-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
