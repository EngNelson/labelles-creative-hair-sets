"use client";

import Container from "@/components/common/Container";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, Clock, XCircle, Store } from "lucide-react";
import { useUserStore } from "@/lib/store";
import Link from "next/link";

interface SellerFormData {
  storeName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface SellerStatus {
  _id: string;
  status: "pending" | "approved" | "rejected";
  storeName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  createdAt: string;
}

interface SellerApplicationFormProps {
  initialSellerStatus?: SellerStatus | null;
}

export default function SellerApplicationForm({
  initialSellerStatus,
}: SellerApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(
    !initialSellerStatus && initialSellerStatus !== null,
  );
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(
    initialSellerStatus || null,
  );
  const { authUser: user, auth_token } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SellerFormData>({
    defaultValues: {
      contactEmail: user?.email || sellerStatus?.contactEmail || "",
    },
  });

  // Fetch seller status on component mount if not provided by SSR
  useEffect(() => {
    if (initialSellerStatus !== undefined) {
      if (initialSellerStatus?.status === "rejected") {
        reset({
          storeName: initialSellerStatus.storeName,
          description: initialSellerStatus.description,
          contactEmail: initialSellerStatus.contactEmail,
          contactPhone: initialSellerStatus.contactPhone,
          street: initialSellerStatus.address.street,
          city: initialSellerStatus.address.city,
          state: initialSellerStatus.address.state,
          country: initialSellerStatus.address.country,
          postalCode: initialSellerStatus.address.postalCode,
        });
      }
      return;
    }

    const fetchSellerStatus = async () => {
      if (!user || !auth_token) {
        setCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/me`,
          {
            headers: {
              Authorization: `Bearer ${auth_token}`,
            },
          },
        );

        if (response.ok) {
          const result = await response.json();
          setSellerStatus(result.data);

          // If rejected, pre-fill form with previous data
          if (result.data.status === "rejected") {
            reset({
              storeName: result.data.storeName,
              description: result.data.description,
              contactEmail: result.data.contactEmail,
              contactPhone: result.data.contactPhone,
              street: result.data.address.street,
              city: result.data.address.city,
              state: result.data.address.state,
              country: result.data.address.country,
              postalCode: result.data.address.postalCode,
            });
          }
        } else if (response.status === 404) {
          // No seller application found - this is fine
          setSellerStatus(null);
        }
      } catch (error) {
        console.error("Error fetching seller status:", error);
      } finally {
        setCheckingStatus(false);
      }
    };

    fetchSellerStatus();
  }, [user, auth_token, reset, initialSellerStatus]);

  const onSubmit = async (data: SellerFormData) => {
    if (!user || !auth_token) {
      toast.error("Please login to apply as a seller");
      router.push("/auth/signin?redirect=/become-seller");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        storeName: data.storeName,
        description: data.description,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
        },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sellers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth_token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          "Server returned an invalid response. Please try again later.",
        );
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      toast.success("Application Submitted Successfully!", {
        description:
          "Your seller application is now pending approval. We'll notify you once it's reviewed.",
        duration: 6000,
      });

      // Refresh the page to show the new status
      window.location.reload();
    } catch (error: any) {
      console.error("Seller registration error:", error);
      toast.error("Application Failed", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit application. Please try again.",
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking seller status
  if (checkingStatus) {
    return (
      <div className="bg-muted min-h-screen py-10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            Checking your seller status...
          </p>
        </div>
      </div>
    );
  }

  // If user is already an approved seller
  if (sellerStatus?.status === "approved") {
    return (
      <div className="bg-muted min-h-screen py-10">
        <Container>
          <div className="max-w-2xl mx-auto bg-background rounded-xl shadow-xs overflow-hidden">
            <div className="bg-green-600 px-8 py-6 text-background text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">You're Already a Seller!</h1>
              <p className="text-green-100 mt-2">
                Your seller account is active and approved
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      Store Name:
                    </span>
                    <p className="text-gray-900">{sellerStatus.storeName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Contact Email:
                    </span>
                    <p className="text-gray-900">{sellerStatus.contactEmail}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Contact Phone:
                    </span>
                    <p className="text-gray-900">{sellerStatus.contactPhone}</p>
                  </div>
                </div>
              </div>

              <Link
                href="/seller"
                className="block w-full bg-primary hover:bg-opacity-90 text-background font-bold py-3 px-4 rounded-md transition duration-300 text-center"
              >
                Go to Seller Dashboard
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // If application is pending
  if (sellerStatus?.status === "pending") {
    return (
      <div className="bg-muted min-h-screen py-10">
        <Container>
          <div className="max-w-2xl mx-auto bg-background rounded-xl shadow-xs overflow-hidden">
            <div className="bg-yellow-500 px-8 py-6 text-background text-center">
              <Clock className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Application Under Review</h1>
              <p className="text-yellow-100 mt-2">
                Your seller application is currently being reviewed
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-2">What's Next?</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Our team is reviewing your application. This typically takes
                  1-3 business days. We'll send you an email notification once a
                  decision has been made.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Submitted Application
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      Store Name:
                    </span>
                    <p className="text-gray-900">{sellerStatus.storeName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Description:
                    </span>
                    <p className="text-gray-900">{sellerStatus.description}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Contact Email:
                    </span>
                    <p className="text-gray-900">{sellerStatus.contactEmail}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Contact Phone:
                    </span>
                    <p className="text-gray-900">{sellerStatus.contactPhone}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Submitted On:
                    </span>
                    <p className="text-gray-900">
                      {new Date(sellerStatus.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/user/profile"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-background font-bold py-3 px-4 rounded-md transition duration-300 text-center"
              >
                Back to Profile
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // If application was rejected, show form with message
  const isRejected = sellerStatus?.status === "rejected";

  return (
    <div className="bg-muted min-h-screen py-10">
      <Container>
        <div className="max-w-3xl mx-auto bg-background rounded-xl shadow-xs overflow-hidden">
          {isRejected && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-0">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">
                    Previous Application Rejected
                  </h3>
                  <p className="text-sm text-red-700">
                    Your previous seller application was not approved. You can
                    submit a new application with updated information. Please
                    ensure all details are accurate and complete.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-gray-900 px-8 py-6 text-background text-center">
            <h1 className="text-2xl font-bold">
              {isRejected ? "Reapply as Seller" : "Seller Registration"}
            </h1>
            <p className="text-gray-300 mt-2">
              {isRejected
                ? "Submit a new application with updated information"
                : "Start selling your products on Entry today"}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Store Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name</label>
                  <input
                    {...register("storeName", {
                      required: "Store name is required",
                    })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="My Premium Store"
                  />
                  {errors.storeName && (
                    <p className="text-red-500 text-xs">
                      {errors.storeName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Email</label>
                  <input
                    {...register("contactEmail", {
                      required: "Contact email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="contact@entry.reactbd.com"
                  />
                  {errors.contactEmail && (
                    <p className="text-red-500 text-xs">
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  {...register("description", {
                    required: "Description is required",
                  })}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 min-h-25 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Tell us about your store and products..."
                ></textarea>
                {errors.description && (
                  <p className="text-red-500 text-xs">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Phone</label>
                <input
                  {...register("contactPhone", {
                    required: "Phone number is required",
                  })}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="+1 234 567 890"
                />
                {errors.contactPhone && (
                  <p className="text-red-500 text-xs">
                    {errors.contactPhone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Business Address
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium">Street Address</label>
                <input
                  {...register("street", { required: "Street is required" })}
                  disabled={loading}
                  className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="123 Business Rd"
                />
                {errors.street && (
                  <p className="text-red-500 text-xs">
                    {errors.street.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <input
                    {...register("city", { required: "City is required" })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State/Province</label>
                  <input
                    {...register("state", { required: "State is required" })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs">
                      {errors.state.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <input
                    {...register("postalCode", {
                      required: "Postal Code is required",
                    })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.postalCode && (
                    <p className="text-red-500 text-xs">
                      {errors.postalCode.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <input
                    {...register("country", {
                      required: "Country is required",
                    })}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {errors.country && (
                    <p className="text-red-500 text-xs">
                      {errors.country.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-opacity-90 text-background font-bold py-3 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </Container>
    </div>
  );
}
