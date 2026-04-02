'use client';
// app/payments/[bookingId]/esewa/verify/page.jsx
// eSewa redirects here after payment: ?transaction_uuid=...&status=COMPLETE&...

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import { FaCheckCircle, FaTimes, FaSpinner } from "react-icons/fa";

export default function EsewaVerifyPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const bookingId      = params?.bookingId;
  const transactionId  = searchParams.get("transaction_uuid");
  const esewaStatus    = searchParams.get("status");          // COMPLETE | FAILED
  const totalAmount    = searchParams.get("total_amount");

  const [verifying, setVerifying] = useState(true);
  const [result, setResult]       = useState(null);    // "success" | "failed"
  const [message, setMessage]     = useState("");

  useEffect(() => {
    if (!transactionId) {
      setResult("failed"); setMessage("No transaction reference found."); setVerifying(false); return;
    }
    if (esewaStatus && esewaStatus !== "COMPLETE") {
      setResult("failed"); setMessage(`Payment was not completed. eSewa status: ${esewaStatus}`); setVerifying(false); return;
    }
    (async () => {
      try {
        const res = await api.post("/api/payments/esewa/verify/", {
          transaction_uuid: transactionId,
          booking_id: bookingId,
          amount: totalAmount,
          environment: localStorage.getItem("esewa_config")
            ? JSON.parse(localStorage.getItem("esewa_config")).environment
            : "test",
        });
        if (res.data.status === "COMPLETE") {
          setResult("success");
          setMessage("Payment verified successfully!");
        } else {
          setResult("failed");
          setMessage(`Payment status: ${res.data.status}. Contact support if amount was deducted.`);
        }
      } catch (err) {
        setResult("failed");
        setMessage(err.response?.data?.message || "Verification failed. Please contact support.");
      } finally {
        setVerifying(false);
      }
    })();
  }, [transactionId, bookingId, esewaStatus, totalAmount]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl border border-white/20 p-10 text-center max-w-md w-full shadow-2xl">

        {verifying && (
          <>
            <FaSpinner className="text-5xl text-green-400 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Verifying payment...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait, do not close this tab.</p>
            {transactionId && <p className="text-xs text-green-400 font-mono mt-3">{transactionId}</p>}
          </>
        )}

        {!verifying && result === "success" && (
          <>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-4xl text-green-400" />
            </div>
            <p className="text-white text-xl font-bold mb-2">Payment Successful!</p>
            <p className="text-gray-400 text-sm mb-2">{message}</p>
            {totalAmount && <p className="text-green-400 font-bold text-lg mb-1">Rs. {totalAmount}</p>}
            {transactionId && <p className="text-xs text-green-400 font-mono mb-6">{transactionId}</p>}
            <button
              onClick={() => router.push(`/manage-bookings/${bookingId}/payments`)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium hover:opacity-90 transition">
              Back to Billing
            </button>
          </>
        )}

        {!verifying && result === "failed" && (
          <>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTimes className="text-4xl text-red-400" />
            </div>
            <p className="text-white text-xl font-bold mb-2">Payment Failed</p>
            <p className="text-gray-400 text-sm mb-6">{message}</p>
            <button
              onClick={() => router.push(`/manage-bookings/${bookingId}/payments`)}
              className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition">
              Back to Billing
            </button>
          </>
        )}
      </div>
    </div>
  );
}