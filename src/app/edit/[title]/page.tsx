"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, X, Type, FileText, AlertCircle, Image as ImageIcon, Loader2, Info, Book, Hash, Quote, ExternalLink } from "lucide-react";

export default function EditPage() {
  const params = useParams();
  const initialTitle = params.title === "new" ? "" : decodeURIComponent(params.title as string);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState("");
  const [footnotes, setFootnotes] = useState("");
  const [loading, setLoading] = useState(params.title !== "new");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (params.title !== "new") {
      async function fetchPage() {
        const res = await fetch(`/api/wiki?title=${encodeURIComponent(initialTitle)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.page) {
            const fullContent = data.page.content;
            // Search for the first footnote definition [^1]: 
            const footnoteMatch = fullContent.match(/\n\s*\[\^.*?\]:/);
            if (footnoteMatch && footnoteMatch.index !== undefined) {
              setContent(fullContent.substring(0, footnoteMatch.index).trim());
              setFootnotes(fullContent.substring(footnoteMatch.index).trim());
            } else {
              setContent(fullContent);
            }
          }
        }
        setLoading(false);
      }
      fetchPage();
    }
  }, [initialTitle, params.title]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const imageMarkdown = `\n![${file.name}](${data.url})\n`;
        setContent((prev) => prev + imageMarkdown);
      } else {
        const data = await res.json();
        setError(data.message || "이미지 업로드에 실패했습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      // Reset the input so the same file can be uploaded again if needed
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    setSaving(true);
    setError("");
    
    // Combine content and footnotes
    const finalContent = footnotes.trim() 
      ? `${content.trim()}\n\n${footnotes.trim()}`
      : content.trim();

    // If we are editing an existing page but changed the title, 
    // we send the original title to handle renaming in the backend
    const res = await fetch("/api/wiki", {
      method: "POST",
      body: JSON.stringify({ 
        originalTitle: params.title === "new" ? null : initialTitle,
        title: title.trim(), 
        content: finalContent 
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      router.push(`/w/${encodeURIComponent(title.trim())}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.message || "저장 중 오류가 발생했습니다.");
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium">문서를 불러오는 중입니다...</p>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {params.title === "new" ? "새 문서 작성" : "문서 편집"}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">지식을 공유하고 위키를 풍성하게 만들어보세요.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white hover:border-gray-300 transition shadow-sm"
          >
            <X size={18} />
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-100"
          >
            <Save size={18} />
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 font-medium animate-shake">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="p-1 bg-gray-50/50 border-b border-gray-100 flex items-center px-6 py-4 gap-4">
            <div className="flex items-center gap-2 text-gray-400 font-bold text-sm uppercase tracking-wider shrink-0">
              <Type size={16} />
              제목
            </div>
            <input
              type="text"
              className="flex-1 bg-transparent text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문서 제목을 입력하세요..."
            />
          </div>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-gray-400 font-bold text-sm uppercase tracking-wider">
                <FileText size={16} />
                내용 (Markdown 지원)
              </div>
              <div className="flex items-center gap-2">
                <label className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  {uploading ? "업로드 중..." : "사진 추가"}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
            <textarea
              className="w-full h-[600px] p-6 bg-gray-50/30 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:bg-white focus:border-blue-200 outline-none transition-all font-mono text-base leading-relaxed"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="마크다운 형식으로 내용을 풍성하게 채워주세요..."
            />
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50/20">
            <div className="flex items-center gap-2 text-gray-400 font-bold text-sm uppercase tracking-wider mb-4">
              <Hash size={16} />
              각주 설명 (예: [^1]: 설명내용)
            </div>
            <textarea
              className="w-full h-[150px] p-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-mono text-sm leading-relaxed"
              value={footnotes}
              onChange={(e) => setFootnotes(e.target.value)}
              placeholder="본문에 사용된 각주에 대한 설명을 입력하세요... (예: [^1]: 이것은 각주입니다)"
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Info className="text-blue-600" size={20} />
              작성 가이드
            </h2>
            
            <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2 custom-scrollbar">
              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Book size={14} /> 위키 링크
                </h3>
                <div className="bg-gray-50 p-3 rounded-xl space-y-2">
                  <div className="text-sm">
                    <code className="text-blue-600 font-bold bg-blue-50 px-1 rounded">[[문서제목]]</code>
                    <p className="text-xs text-gray-500 mt-1">다른 문서로 연결합니다.</p>
                  </div>
                  <div className="text-sm">
                    <code className="text-blue-600 font-bold bg-blue-50 px-1 rounded">[[제목|이름]]</code>
                    <p className="text-xs text-gray-500 mt-1">다른 이름으로 링크를 만듭니다.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Hash size={14} /> 각주
                </h3>
                <div className="bg-gray-50 p-3 rounded-xl space-y-3">
                  <div className="text-sm">
                    <p className="text-xs text-gray-500 mb-1">문장 끝에 삽입:</p>
                    <code className="text-green-600 font-bold bg-green-50 px-1 rounded">내용입니다.[^1]</code>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs text-gray-500 mb-1">문서 하단에 설명:</p>
                    <code className="text-green-600 font-bold bg-green-50 px-1 rounded">[^1]: 각주 설명</code>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Hash size={14} /> 제목 크기
                </h3>
                <div className="bg-gray-50 p-3 rounded-xl space-y-2">
                  <div className="text-sm font-bold flex justify-between">
                    <span># 대제목</span>
                    <span className="text-gray-300">h1</span>
                  </div>
                  <div className="text-sm font-bold flex justify-between">
                    <span>## 중제목</span>
                    <span className="text-gray-300">h2</span>
                  </div>
                  <div className="text-sm font-bold flex justify-between">
                    <span>### 소제목</span>
                    <span className="text-gray-300">h3</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Hash size={14} /> 특수 기호 & 수식
                </h3>
                <div className="bg-gray-50 p-3 rounded-xl space-y-3">
                  <div className="text-sm">
                    <p className="text-xs text-gray-500 mb-1">수학 공식 (KaTeX):</p>
                    <code className="text-purple-600 font-bold bg-purple-50 px-1 rounded">$E=mc^2$</code>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs text-gray-500 mb-1">이모지 단축어:</p>
                    <code className="text-amber-600 font-bold bg-amber-50 px-1 rounded">:smile: :heart:</code>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs text-gray-500 mb-1">HTML 엔티티:</p>
                    <code className="text-gray-600 font-bold bg-gray-100 px-1 rounded">&copy; &plusmn; &rarr;</code>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Quote size={14} /> 기타 서식
                </h3>
                <ul className="text-sm space-y-2 font-medium text-gray-600">
                  <li className="flex justify-between">
                    <span>**굵게**</span>
                    <span className="bg-gray-100 px-1 rounded text-xs">Bold</span>
                  </li>
                  <li className="flex justify-between">
                    <span>*기울임*</span>
                    <span className="bg-gray-100 px-1 rounded text-xs">Italic</span>
                  </li>
                  <li className="flex justify-between">
                    <span>{">"} 인용구</span>
                    <span className="bg-gray-100 px-1 rounded text-xs">Quote</span>
                  </li>
                  <li className="flex justify-between">
                    <span>- 리스트</span>
                    <span className="bg-gray-100 px-1 rounded text-xs">List</span>
                  </li>
                </ul>
              </section>

              <div className="pt-4 border-t border-gray-100">
                <a 
                  href="https://www.markdownguide.org/basic-syntax/" 
                  target="_blank" 
                  className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  <ExternalLink size={12} />
                  상세 마크다운 가이드
                </a>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-100">
            <h3 className="font-black mb-2">꿀팁! 💡</h3>
            <p className="text-xs leading-relaxed opacity-90 font-medium">
              사진을 먼저 업로드하고 그 아래에 설명을 적으면 깔끔한 문서가 됩니다. [[ ]]를 적극적으로 활용해 문서를 연결해보세요!
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

