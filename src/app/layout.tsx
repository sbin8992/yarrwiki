import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Search, Shield, LogOut } from "lucide-react";
import PermissionRequestButton from "./PermissionRequestButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "야르위키",
    template: "%s - 야르위키",
  },
  description: "지식 공유의 시작, 야르위키",
  verification: {
    google: "epZP__wnyYVwmEwiUrPN_blOngfW2-S3bm4s8Px-jOQ",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  let requestStatus = null;
  if (session && !session.canEdit && !session.isAdmin) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const request = await prisma.permissionRequest.findFirst({
        where: {
          userId: session.userId,
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
      });
      if (request) requestStatus = "PENDING";
    } catch (error) {
      console.error("Permission request status unavailable:", error);
    }
  }

  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-2 group">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition shadow-sm">
                    <span className="text-white text-xl font-bold">Y</span>
                  </div>
                  <span className="ml-1">야르위키</span>
                </Link>
                <div className="ml-10 hidden md:flex space-x-1">
                  <Link href={`/w/${encodeURIComponent("대문")}`} className="text-sky-500 hover:text-sky-600 px-4 py-2 rounded-xl text-sm font-bold transition">
                    대문
                  </Link>
                </div>
              </div>
              <div className="flex-1 max-w-md mx-8 hidden lg:block">
                <form action="/" className="relative">
                  <input
                    type="text"
                    name="q"
                    placeholder="지식 검색..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </form>
              </div>
              <div className="flex items-center space-x-3">
                {session ? (
                  <div className="flex items-center gap-4">
                    {!session.canEdit && !session.isAdmin && (
                      <PermissionRequestButton initialStatus={requestStatus || undefined} />
                    )}
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Logged in as</span>
                      <span className="text-sm text-gray-900 font-black">{session.username}</span>
                    </div>
                    {session.isAdmin && (
                      <Link href="/admin" className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition shadow-sm" title="관리자 대시보드">
                        <Shield size={18} />
                      </Link>
                    )}
                    <form action="/api/auth/logout" method="POST">
                      <button type="submit" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition" title="로그아웃">
                        <LogOut size={18} />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 font-bold px-4 py-2 transition">
                      로그인
                    </Link>
                    <Link href="/signup" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200">
                      회원가입
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 mt-auto py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            © 2026 야르위키. 모든 내용은 자유롭게 열람할 수 있습니다.
          </div>
        </footer>
      </body>
    </html>
  );
}
