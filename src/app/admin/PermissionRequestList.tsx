"use client";

import { useState } from "react";
import { Check, X, Clock, User } from "lucide-react";

interface Request {
  id: number;
  userId: number;
  user: {
    username: string;
  };
  createdAt: string | Date;
}

export default function PermissionRequestList({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleAction = async (requestId: number, action: "APPROVE" | "REJECT") => {
    setLoadingId(requestId);
    try {
      const res = await fetch("/api/admin/permission-request/action", {
        method: "POST",
        body: JSON.stringify({ requestId, action }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setRequests(requests.filter(r => r.id !== requestId));
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (error) {
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={32} />
        </div>
        <p className="text-gray-400 font-medium">대기 중인 권한 요청이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {requests.map((request) => (
        <div key={request.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-900">{request.user.username}</p>
              <p className="text-xs text-gray-400">
                요청일: {new Date(request.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(request.id, "REJECT")}
              disabled={loadingId !== null}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition disabled:opacity-50 flex items-center gap-1"
            >
              <X size={16} />
              거절
            </button>
            <button
              onClick={() => handleAction(request.id, "APPROVE")}
              disabled={loadingId !== null}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50 flex items-center gap-1"
            >
              <Check size={16} />
              승인
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
