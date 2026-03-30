"use client";

import Link from "next/link";
import { LogIn, ShieldAlert } from "lucide-react";
import Container from "@/components/common/Container";
import { useAuthSidebarStore } from "@/lib/useAuthSidebarStore";
import { useUserStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BecomeSellerAuthRequired() {
  const { openLogin, openRegister, isOpen } = useAuthSidebarStore();
  const { isAuthenticated } = useUserStore();
  const router = useRouter();

  // Watch for authentication changes and refresh the page to reload the server component
  useEffect(() => {
    if (isAuthenticated) {
      router.refresh();
    }
  }, [isAuthenticated, router]);

  return (
    <div className="bg-muted/30 min-h-screen py-20 relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none"></div>

      <Container>
        <div className="max-w-2xl mx-auto bg-background rounded-3xl shadow-xl overflow-hidden border border-border relative z-10">
          <div className="bg-linear-to-br from-[#1e1e2e] to-primary px-8 py-16 text-background text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-b from-transparent to-primary/50 mix-blend-overlay"></div>

            <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
              <ShieldAlert className="w-10 h-10 text-yellow-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3 relative z-10">
              Authentication Required
            </h1>
            <p className="text-gray-300 relative z-10">
              Please sign in to apply to become an Entry Seller
            </p>
          </div>

          <div className="p-8 md:p-14 text-center bg-card">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Partner with Entry
            </h2>
            <p className="text-muted-foreground mb-10 text-lg">
              To apply as a seller and start selling your high-quality baby
              products on our platform, you need to securely authenticate. If
              you don't have an account yet, joining is completely free.
            </p>

            <div className="space-y-6">
              <button
                onClick={() => openLogin()}
                className="inline-flex items-center justify-center w-full sm:w-auto gap-2 bg-accent hover:bg-accent/90 focus:ring-4 focus:ring-accent/20 text-white font-bold py-4 px-10 rounded-full transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-accent/20 cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                Sign In to Continue
              </button>

              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  onClick={() => openRegister()}
                  className="text-primary hover:text-accent underline underline-offset-4 font-semibold transition-colors cursor-pointer inline-flex"
                >
                  Create one here
                </button>
              </p>
            </div>

            <div className="mt-14 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-4">
              <p className="text-muted-foreground m-0">
                Want to learn more about our seller program?
              </p>
              <Link
                href="/seller-guide"
                className="inline-flex items-center gap-2 text-primary hover:text-accent font-semibold transition-colors"
              >
                View Seller Guide →
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
