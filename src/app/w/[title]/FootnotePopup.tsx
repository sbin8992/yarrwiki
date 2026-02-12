"use client";

import { useState, useRef, useEffect } from "react";

export default function FootnotePopup({ 
  content, 
  children 
}: { 
  id: string; 
  content: string; 
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLSpanElement>(null);
  
  // Clean content: remove the backlink arrow if present and trim
  const cleanContent = content.replace(/↩/g, "").replace(/\[\^.*?\]/g, "").trim();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <span className="relative inline-block align-baseline" ref={popupRef}>
      {isOpen && (
        <span 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72 max-w-[80vw] p-4 bg-white border border-gray-200 shadow-2xl rounded-2xl text-sm leading-relaxed text-gray-700 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 cursor-default"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="relative z-10">
            {cleanContent || (
              <span className="text-gray-400 italic text-xs">설명이 없는 각주입니다.</span>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 z-0" />
        </span>
      )}
      <sup className="ml-0.5">
        <button
          type="button"
          className={`
            text-sky-600 font-bold px-1.5 py-0.5 rounded-md transition-all text-[0.85em] cursor-pointer
            ${isOpen ? 'bg-sky-100 ring-2 ring-sky-200 shadow-sm' : 'hover:bg-sky-50'}
          `}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {children}
        </button>
      </sup>
    </span>
  );
}
