import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFootnotes from "remark-footnotes";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import FootnotePopup from "./FootnotePopup";

export default async function WikiViewPage({
  params,
}: {
  params: Promise<{ title: string }>;
}) {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  const session = await getSession();

  const page = await prisma.wikiPage.findUnique({
    where: { title: decodedTitle },
    include: { updatedBy: true },
  });

  // Helper to process [[Internal Links]]
  const processWikiLinks = (content: string) => {
    return content.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (_, target, label) => {
      const displayText = label || target;
      const url = `/w/${encodeURIComponent(target)}`;
      return `[${displayText}](${url})`;
    });
  };

  const processedContent = page ? processWikiLinks(page.content) : "";

  // Extract footnotes into a map for popups
  const footnoteMap: Record<string, string> = {};
  // Match [^1]: content (content can span multiple lines until next footnote or double newline)
  const footnoteRegex = /^\[\^(.*?)\]:([\s\S]*?)(?=\n\[\^|\n\n|$)/gm;
  let m;
  while ((m = footnoteRegex.exec(processedContent)) !== null) {
    const key = m[1].trim();
    const value = m[2].trim().replace(/\s+/g, " "); // Clean up newlines and extra spaces
    if (key && value) {
      footnoteMap[key] = value;
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            {decodedTitle}
          </h1>
          {page && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-3 font-medium">
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase tracking-wider">최근 수정</span>
              <span>{page.updatedBy.username}</span>
              <span className="text-gray-200">|</span>
              <span>{new Date(page.updatedAt).toLocaleString("ko-KR")}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {session?.canEdit && (
            <Link
              href={`/edit/${title}`}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
            >
              {page ? "수정" : "생성"}
            </Link>
          )}
        </div>
      </div>
      <div className="px-8 py-12">
        {page ? (
          <article className="prose prose-sky max-w-none 
            prose-headings:font-black prose-headings:tracking-tight prose-headings:border-b prose-headings:pb-3 prose-headings:mt-12 first:prose-headings:mt-0
            prose-a:text-sky-500 prose-a:no-underline hover:prose-a:underline prose-a:font-bold
            prose-img:rounded-3xl prose-img:shadow-xl prose-img:mx-auto
            prose-blockquote:border-l-4 prose-blockquote:border-sky-500 prose-blockquote:bg-sky-50/50 prose-blockquote:py-2 prose-blockquote:rounded-r-2xl
            ">
            <ReactMarkdown 
              remarkPlugins={[
                [remarkFootnotes, { inlineNotes: false }],
                remarkMath,
                remarkEmoji,
                remarkBreaks,
              ]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{
                a: ({ href, children }) => {
                  // Catch all footnote-like hash links
                  if (href?.startsWith("#fn") || (href?.startsWith("#") && !isNaN(Number(href.substring(1))))) {
                    // Extract numeric or ID part from things like #fn-1, #fn1, #1, #user-content-fn-1
                    const idMatch = href.match(/fn-?(.*)$/) || href.match(/#(.*)$/);
                    const id = idMatch ? idMatch[1] : "";
                    
                    // Try to find content by ID, or fallback to exact match if ID extraction was weird
                    const content = footnoteMap[id] || footnoteMap[href.replace("#", "")] || "";
                    return <FootnotePopup id={id} content={content}>{children}</FootnotePopup>;
                  }

                  const isInternal = href?.startsWith("/w/");
                  if (isInternal) {
                    return <Link href={href as string} className="text-sky-500 font-bold hover:underline">{children}</Link>;
                  }
                  
                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-500 font-bold hover:underline">{children}</a>;
                },
                // Style the footnotes section at the bottom
                section: ({ children, ...props }) => {
                  if (props.className === 'footnotes') {
                    return (
                      <section className="mt-16 pt-8 border-t border-gray-100 text-sm text-gray-600">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
                          각주
                        </h2>
                        <div className="space-y-3">
                          {children}
                        </div>
                      </section>
                    );
                  }
                  return <section {...props}>{children}</section>;
                },
                ol: ({ children, ...props }) => {
                  // Check if this OL is inside a footnotes section (via a wrapper or context, 
                  // but ReactMarkdown doesn't easily provide parent context here, 
                  // so we'll style all OLs slightly better or use a CSS-in-JS approach if needed.
                  // For now, let's just ensure list-style is visible.)
                  return <ol className="list-decimal list-inside space-y-2" {...props}>{children}</ol>;
                },
                li: ({ children, ...props }) => {
                  // If it's a footnote LI (remark-footnotes uses IDs like fn-1, fn-2)
                  if (props.id?.startsWith('fn-')) {
                    const id = props.id.replace('fn-', '').replace('user-content-', '');
                    return (
                      <li id={props.id} className="list-none flex gap-3 group">
                        <span className="font-bold text-sky-600 min-w-[2rem] text-right">[{id}]</span>
                        <div className="flex-1 prose-sm">{children}</div>
                      </li>
                    );
                  }
                  return <li {...props}>{children}</li>;
                },
                // Prevent standard sup from adding extra styles
                sup: ({ children }) => children,
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </article>
        ) : (
          <div className="text-center py-32">
            <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl font-black">?</span>
            </div>
            <p className="text-gray-400 text-xl font-bold mb-6">해당 이름의 문서가 아직 없습니다.</p>
            {session?.canEdit ? (
              <Link
                href={`/edit/${title}`}
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-100"
              >
                첫 번째 내용 작성하기
              </Link>
            ) : (
              <p className="text-sm text-gray-400 font-medium bg-gray-50 inline-block px-4 py-2 rounded-xl">편집 권한이 있는 사용자만 새 문서를 생성할 수 있습니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
