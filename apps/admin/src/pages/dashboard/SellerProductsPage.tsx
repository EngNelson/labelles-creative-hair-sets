import SellerProductsList from "@/components/seller-config/SellerProductsList";

export const metadata = {
  title: "Seller Products - Entry Admin",
  description: "Manage seller products and approvals",
};

export default function SellerProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seller Products</h1>
        <p className="text-gray-600 mt-1">
          Review and approve products submitted by sellers
        </p>
      </div>
      <SellerProductsList />
    </div>
  );
}
