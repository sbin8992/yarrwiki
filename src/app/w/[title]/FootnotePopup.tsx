"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

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

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  return (
    <span className="relative inline-block align-baseline" ref={popupRef}>
      {isOpen && (
        <span 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[100] w-80 max-w-[85vw] p-5 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl text-sm leading-relaxed text-gray-700 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 cursor-default"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="relative z-10 overflow-y-auto max-h-60 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {cleanContent ? (
              <div className={`prose prose-sm prose-sky max-w-none 
                prose-p:my-1 prose-a:text-sky-600 prose-a:font-bold hover:prose-a:underline
                prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              `}>
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {cleanContent}
                </ReactMarkdown>
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs">설명이 없는 각주입니다.</span>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45 z-0" />
        </span>
      )}
      <span className="mx-0.5">
        <button
          type="button"
          className={`
            inline-flex items-center justify-center
            text-sky-600 font-bold px-1 py-0.5 rounded-md transition-all cursor-pointer
            ${isOpen ? 'bg-sky-100 ring-2 ring-sky-200 shadow-sm' : 'hover:bg-sky-50 active:scale-95'}
          `}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          [{children}]
        </button>
      </span>
    </span>
  );
}
