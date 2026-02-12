"use client";

import { useState } from "react";
import { UserPlus, Clock, CheckCircle } from "lucide-react";

export default function PermissionRequestButton({ initialStatus }: { initialStatus?: string }) {
  const [status, setStatus] = useState<string | null>(initialStatus || null);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/permission-request", {
        method: "POST",
      });
      if (res.ok) {
        setStatus("PENDING");
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (error) {
      alert("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "PENDING") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold border border-amber-100 shadow-sm">
        <Clock size={14} />
        권한 요청 대기 중
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100 shadow-sm">
        <CheckCircle size={14} />
        권한 승인됨
      </div>
    );
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
    >
      <UserPlus size={14} />
      {loading ? "요청 중..." : "편집 권한 요청"}
    </button>
  );
}
