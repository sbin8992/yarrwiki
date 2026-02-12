"use client";

import { useState } from "react";

export default function PermissionToggle({ 
  userId, 
  initialCanEdit, 
  disabled 
}: { 
  userId: number; 
  initialCanEdit: boolean;
  disabled: boolean;
}) {
  const [canEdit, setCanEdit] = useState(initialCanEdit);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    const res = await fetch("/api/admin/permission", {
      method: "POST",
      body: JSON.stringify({ userId, canEdit: !canEdit }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      setCanEdit(!canEdit);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        canEdit ? "bg-blue-600" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          canEdit ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
