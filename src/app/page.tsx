import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search, Plus, BookOpen, Clock, ShieldCheck } from "lucide-react";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const recentPages = await prisma.wikiPage.findMany({
    where: q ? {
      title: {
        contains: q
      }
    } : undefined,
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: { updatedBy: true }
  });

  return (
    <div className="space-y-12">
      <section className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
        <h1 className="text-6xl font-black text-gray-900 mb-6 tracking-tight">
          야르위키<span className="text-blue-600">.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          누구나 자유롭게 정보를 탐색하고 지식을 공유할 수 있는 공간입니다.
          당신의 지식을 보태어 위키를 풍성하게 만들어보세요.
        </p>
        
        <div className="max-w-xl mx-auto px-4 mb-10">
          <form action="/" className="relative group">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="문서 제목을 검색해보세요..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all text-lg"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={24} />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition font-bold shadow-md shadow-blue-200">
              검색
            </button>
          </form>
        </div>

        <div className="flex justify-center gap-4">
          <Link href="/w/대문" className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-100 group">
            <BookOpen size={20} className="group-hover:scale-110 transition" />
            대문 바로가기
          </Link>
          <Link href="/edit/new" className="flex items-center gap-2 bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 rounded-2xl font-bold hover:border-blue-200 hover:bg-blue-50/50 transition shadow-sm group">
            <Plus size={20} className="text-blue-600 group-hover:rotate-90 transition" />
            새 문서 작성
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Clock className="text-blue-600" size={24} />
              {q ? `'${q}' 검색 결과` : "최근 변경된 문서"}
            </h2>
            {!q && <Link href="/recent" className="text-sm text-gray-400 hover:text-blue-600 font-medium">더보기 →</Link>}
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
                        {new Date(page.updatedAt).toLocaleDateString("ko-KR")}
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
                <p className="text-gray-400 font-medium mb-2">검색 결과가 없습니다.</p>
                <Link href="/edit/new" className="text-blue-600 hover:underline font-bold">첫 번째 문서를 작성해보세요!</Link>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-24">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <ShieldCheck className="text-green-500" size={24} />
            야르위키 규칙
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-green-50/50 rounded-2xl border border-green-100">
              <div className="w-8 h-8 bg-green-500 text-white rounded-xl flex items-center justify-center font-bold shrink-0">1</div>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                누구나 모든 문서를 자유롭게 읽을 수 있습니다.
              </p>
            </div>
            <div className="flex gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shrink-0">2</div>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                편집은 권한이 있는 사용자만 가능합니다.
              </p>
            </div>
            <div className="flex gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
              <div className="w-8 h-8 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold shrink-0">3</div>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                편집 권한이 필요하면 관리자에게 요청하세요.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/signup" className="block text-center py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200">
                지금 가입하고 시작하기
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}