import React from "react";
import Container from "@/components/common/Container";
import { Title } from "@/components/common/text";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import {
  RotateCcw,
  Package,
  CreditCard,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

const ReturnsPage = () => {
  const returnSteps = [
    {
      step: 1,
      title: "Initiate Return",
      description:
        "Log into your account and select the items you want to return",
      icon: <Package size={24} />,
    },
    {
      step: 2,
      title: "Print Label",
      description: "Print the prepaid return shipping label",
      icon: <RotateCcw size={24} />,
    },
    {
      step: 3,
      title: "Pack & Ship",
      description: "Pack items securely and drop off at any shipping location",
      icon: <Package size={24} />,
    },
    {
      step: 4,
      title: "Get Refund",
      description:
        "Receive your refund within 5-7 business days after we process your return",
      icon: <CreditCard size={24} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="pt-6">
        <PageBreadcrumb currentPage="Returns & Exchanges" items={[]} />
      </Container>

      <Container className="py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Title className="text-4xl font-bold mb-4">
              Returns & Exchanges
            </Title>
            <p className="text-gray-600 text-lg">
              We want you to love your purchase. If you&apos;re not completely
              satisfied, we&apos;re here to help with easy returns and
              exchanges.
            </p>
          </div>

          {/* Return Policy Overview */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Our Return Policy</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="text-green-500 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">30-Day Return Window</h3>
                    <p className="text-gray-600 text-sm">
                      Return items within 30 days of delivery
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="text-green-500 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Free Return Shipping</h3>
                    <p className="text-gray-600 text-sm">
                      We provide prepaid return labels
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="text-green-500 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Full Refund</h3>
                    <p className="text-gray-600 text-sm">
                      Get your money back to original payment method
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="text-orange-500 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">
                      Original Condition Required
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Items must be unused with original tags
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="text-orange-500 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Original Packaging</h3>
                    <p className="text-gray-600 text-sm">
                      Include all original packaging and accessories
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="text-orange-500 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold">Receipt Required</h3>
                    <p className="text-gray-600 text-sm">
                      Original receipt or proof of purchase needed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How to Return */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">How to Return Items</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {returnSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <div className="text-primary">{step.icon}</div>
                  </div>
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-semibold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/user/orders"
                className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors inline-block"
              >
                Start a Return
              </Link>
            </div>
          </div>

          {/* Exchange Policy */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Exchanges</h2>

            <p className="text-gray-700 mb-4">
              Need a different size or color? We make exchanges easy! Simply
              return your original item and place a new order for the item you
              want. This ensures you get your new item as quickly as possible.
            </p>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Exchange Process:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Return your original item using the process above</li>
                <li>Place a new order for the item you want</li>
                <li>
                  We&apos;ll refund your original purchase once we receive the
                  return
                </li>
              </ol>
            </div>
          </div>

          {/* Non-Returnable Items */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">
              Non-Returnable Items
            </h2>

            <p className="text-gray-700 mb-4">
              For health and safety reasons, the following items cannot be
              returned:
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-gray-700">
                <li>• Breast pumps and accessories</li>
                <li>• Bottles and sippy cups (if opened)</li>
                <li>• Baby monitors (if opened)</li>
                <li>• Bathing items</li>
              </ul>
              <ul className="space-y-2 text-gray-700">
                <li>• Personalized or custom items</li>
                <li>• Gift cards</li>
                <li>• Sale items marked &quot;Final Sale&quot;</li>
                <li>• Items damaged by normal wear</li>
              </ul>
            </div>
          </div>

          {/* Refund Information */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Refund Information</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Processing Time</h3>
                <p className="text-gray-700">
                  Refunds are processed within 2-3 business days after we
                  receive your return. It may take an additional 3-5 business
                  days for the refund to appear in your account.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Refund Method</h3>
                <p className="text-gray-700">
                  Refunds are issued to the original payment method. If you paid
                  with a credit card, the refund will appear on your credit card
                  statement.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Partial Refunds</h3>
                <p className="text-gray-700">
                  In some cases, partial refunds may be granted for items that
                  show signs of use or are missing original packaging.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="bg-primary/10 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Need Help with Returns?</h3>
            <p className="text-gray-600 mb-6">
              Our customer service team is here to help make your return as easy
              as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/help/contact"
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/user/orders"
                className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                View My Orders
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ReturnsPage;
