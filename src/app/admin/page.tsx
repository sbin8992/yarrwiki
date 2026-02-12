import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PermissionToggle from "./PermissionToggle";
import PermissionRequestList from "./PermissionRequestList";
import { Users, Shield, Edit3, UserCheck, Search, Clock, Book } from "lucide-react";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || !session.isAdmin) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
  });

  const requests = await prisma.permissionRequest.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  const pageCount = await prisma.wikiPage.count();

  const stats = {
    total: users.length,
    admins: users.filter(u => u.isAdmin).length,
    editors: users.filter(u => u.canEdit).length,
    pages: pageCount
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Shield className="text-blue-600" size={36} />
            관리자 대시보드
          </h1>
          <p className="text-gray-500 mt-2">사용자들의 편집 권한을 관리하고 커뮤니티를 유지하세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">전체 사용자</p>
              <p className="text-3xl font-black text-gray-900">{stats.total}명</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
              <Book size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">전체 문서</p>
              <p className="text-3xl font-black text-gray-900">{stats.pages}개</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">편집 가능</p>
              <p className="text-3xl font-black text-gray-900">{stats.editors}명</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">관리자</p>
              <p className="text-3xl font-black text-gray-900">{stats.admins}명</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-amber-50/30 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 text-amber-700">
            <Clock size={20} className="text-amber-600" />
            권한 요청 대기열
          </h2>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
            {requests.length}건 대기 중
          </span>
        </div>
        <PermissionRequestList initialRequests={requests} />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Edit3 size={20} className="text-blue-600" />
            사용자 권한 설정
          </h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="사용자 검색..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="py-4 px-8 font-bold text-gray-400 text-xs uppercase tracking-widest">사용자 정보</th>
                <th className="py-4 px-8 font-bold text-gray-400 text-xs uppercase tracking-widest text-center">역할</th>
                <th className="py-4 px-8 font-bold text-gray-400 text-xs uppercase tracking-widest text-center">편집 권한 활성화</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/20 transition group">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                        {user.username[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900">{user.username}</span>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-center">
                    {user.isAdmin ? (
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-tighter">
                        ADMIN
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-tighter">
                        USER
                      </span>
                    )}
                  </td>
                  <td className="py-5 px-8 text-center">
                    <div className="flex justify-center">
                      <PermissionToggle userId={user.id} initialCanEdit={user.canEdit} disabled={user.isAdmin} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
