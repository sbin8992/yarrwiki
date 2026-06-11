import Link from "next/link";
import { findWikiPages } from "@/lib/wikiData";
import { Clock, BookOpen } from "lucide-react";

export default async function RecentChangesPage() {
  const recentPages = await findWikiPages({
    take: 50,
    orderBy: "updatedAt",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Clock className="text-blue-600" size={24} />
            최근 변경된 문서
          </h2>
          <Link href="/" className="text-sm text-gray-400 hover:text-blue-600 font-medium">← 홈으로</Link>
        </div>
        
        <div className="space-y-3">
          {recentPages.length > 0 ? (
            recentPages.map((page) => (
              <div key={page.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition group">
                <div className="mb-2 sm:mb-0">
                  <Link href={`/w/${encodeURIComponent(page.title)}`} className="text-lg font-bold text-sky-500 hover:text-sky-600 transition block mb-1">
                    {page.title}
                  </Link>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      {page.updatedBy.username}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      {new Date(page.updatedAt).toLocaleString("ko-KR")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                  <Link href={`/w/${encodeURIComponent(page.title)}`} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
                    <BookOpen size={16} />
                    읽기
                  </Link>
                  <Link href={`/edit/${encodeURIComponent(page.title)}`} className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition">
                    편집
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 font-medium">변경된 문서가 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
