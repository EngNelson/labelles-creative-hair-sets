import Container from "@/components/common/Container";
import Link from "next/link";
import { Store, AlertCircle } from "lucide-react";

export default function SellerDisabled() {
  return (
    <div className="bg-muted min-h-screen py-20">
      <Container>
        <div className="max-w-2xl mx-auto bg-background rounded-xl shadow-lg overflow-hidden">
          <div className="bg-linear-to-r from-gray-600 to-gray-500 px-8 py-12 text-background text-center">
            <Store className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <h1 className="text-3xl font-bold mb-2">
              Seller System Unavailable
            </h1>
            <p className="text-gray-200">
              The seller marketplace is currently not available
            </p>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Temporarily Disabled
                </h3>
                <p className="text-sm text-amber-800">
                  Our seller marketplace is currently undergoing maintenance or
                  has been temporarily disabled. Please check back later or
                  contact us for more information.
                </p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                In the meantime, you can explore our curated selection of
                products from our trusted partners.
              </p>

              <Link
                href="/"
                className="inline-block bg-primary hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-full transition-all duration-300"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
