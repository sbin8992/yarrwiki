import Link from "next/link";
import { findWikiPages } from "@/lib/wikiData";
import { Book, Search, BookOpen } from "lucide-react";

export default async function AllPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const allPages = await findWikiPages({
    q,
    orderBy: "title",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Book className="text-blue-600" size={24} />
              모든 문서 목록
            </h2>
            <p className="text-gray-500 text-sm mt-1">야르위키의 모든 지식을 가나다순으로 확인해보세요.</p>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-blue-600 font-medium">← 홈으로</Link>
        </div>

        <div className="mb-8">
          <form action="/all" className="relative group">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="문서 제목으로 필터링..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          </form>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allPages.length > 0 ? (
            allPages.map((page) => (
              <div key={page.id} className="p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition group flex justify-between items-center">
                <Link href={`/w/${encodeURIComponent(page.title)}`} className="text-lg font-bold text-sky-500 hover:text-sky-600 transition truncate pr-4">
                  {page.title}
                </Link>
                <div className="flex gap-1 shrink-0">
                  <Link href={`/w/${encodeURIComponent(page.title)}`} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 rounded-xl transition shadow-sm" title="읽기">
                    <BookOpen size={16} />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 font-medium">문서가 없습니다.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
