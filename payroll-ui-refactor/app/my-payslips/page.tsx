"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyPayslipsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/payment-history");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Redirecting to Payment History...</p>
      </div>
    </div>
  );
}
