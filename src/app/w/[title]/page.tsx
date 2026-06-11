import { getSession } from "@/lib/auth";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkFootnotes from "remark-footnotes";
import remarkMath from "remark-math";
import remarkEmoji from "remark-emoji";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import FootnotePopup from "./FootnotePopup";
import { Metadata } from "next";
import { ListTree } from "lucide-react";
import { buildHeadingIdByLine, buildTableOfContents } from "@/lib/wikiToc";
import type { PluggableList } from "unified";
import { findWikiPageByTitle } from "@/lib/wikiData";

type MarkdownNodeWithPosition = {
  position?: {
    start?: {
      line?: number;
    };
  };
};

function getPlainText(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getPlainText).join("");
  }

  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ title: string }>;
}): Promise<Metadata> {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  return {
    title: decodedTitle,
  };
}

export default async function WikiViewPage({
  params,
}: {
  params: Promise<{ title: string }>;
}) {
  const { title } = await params;
  const decodedTitle = decodeURIComponent(title);
  const session = await getSession();

  const page = await findWikiPageByTitle(decodedTitle);

  // Helper to process [[Internal Links]]
  const processWikiLinks = (content: string) => {
    return content.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (_, target, label) => {
      const displayText = label || target;
      const url = `/w/${encodeURIComponent(target)}`;
      return `[${displayText}](${url})`;
    });
  };

  const processedContent = page ? processWikiLinks(page.content) : "";
  const tocItems = buildTableOfContents(processedContent);
  const headingIdByLine = buildHeadingIdByLine(processedContent);
  const remarkPlugins = [
    [remarkFootnotes, { inlineNotes: false }],
    remarkMath,
    remarkEmoji,
    remarkBreaks,
  ] as unknown as PluggableList;

  // Extract footnotes into a map for popups
  const footnoteMap: Record<string, string> = {};
  // Match [^1]: content (content can span multiple lines until next footnote definition)
  const footnoteRegex = /^\[\^(.*?)\]:\s*([\s\S]*?)(?=\n\[\^|$)/gm;
  let m;
  while ((m = footnoteRegex.exec(processedContent)) !== null) {
    const key = m[1].trim();
    const value = m[2].trim();
    if (key && value) {
      footnoteMap[key] = value;
    }
  }

  const renderHeading = (
    level: 1 | 2 | 3,
    children: React.ReactNode,
    node?: MarkdownNodeWithPosition,
  ) => {
    const id = node?.position?.start?.line
      ? headingIdByLine.get(node.position.start.line)
      : undefined;

    if (!id && getPlainText(children).trim() === "Footnotes") {
      return null;
    }

    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
    const classNameByLevel = {
      1: "group scroll-mt-24 rounded-2xl border-l-4 border-sky-500 bg-sky-50/80 px-5 py-4 text-3xl font-black text-gray-950 shadow-sm shadow-sky-100/60",
      2: "group scroll-mt-24 rounded-xl border-l-4 border-blue-400 bg-blue-50/70 px-4 py-3 text-2xl font-black text-gray-900",
      3: "group scroll-mt-24 rounded-lg border-l-4 border-gray-300 bg-gray-50 px-4 py-2.5 text-xl font-extrabold text-gray-850",
    };

    return (
      <Tag id={id} className={classNameByLevel[level]}>
        {id ? (
          <a href={`#${id}`} className="no-underline">
            {children}
          </a>
        ) : children}
      </Tag>
    );
  };

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
      <div className="px-4 sm:px-8 py-8 sm:py-12">
        {page ? (
          <div className={tocItems.length > 0 ? "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_18rem] gap-8 xl:gap-10 items-start" : ""}>
            <article className="prose prose-sky max-w-none 
              prose-headings:font-black prose-headings:tracking-tight prose-headings:mt-12 first:prose-headings:mt-0
              prose-a:text-sky-500 prose-a:no-underline hover:prose-a:underline prose-a:font-bold
              prose-img:rounded-3xl prose-img:shadow-xl prose-img:mx-auto
              prose-blockquote:border-l-4 prose-blockquote:border-sky-500 prose-blockquote:bg-sky-50/50 prose-blockquote:py-2 prose-blockquote:rounded-r-2xl
              ">
              <ReactMarkdown 
                remarkPlugins={remarkPlugins}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                  h1: ({ children, node }) => renderHeading(1, children, node),
                  h2: ({ children, node }) => renderHeading(2, children, node),
                  h3: ({ children, node }) => renderHeading(3, children, node),
                  a: ({ href, children }) => {
                    const hrefStr = href || "";
                    // Catch all footnote-like hash links
                    // Look for # anywhere and check if the hash part contains 'fn' or is a number
                    const hashIndex = hrefStr.indexOf("#");
                    const isFootnoteLink = hashIndex !== -1 && (
                      hrefStr.includes("fn", hashIndex) || 
                      !isNaN(Number(hrefStr.substring(hashIndex + 1).replace("user-content-", "")))
                    );
                    
                    if (isFootnoteLink) {
                      // Extract numeric or ID part
                      const hashPart = hrefStr.substring(hashIndex + 1);
                      // Get the part after 'fn-' or just use the whole hash if it's numeric
                      const idMatch = hashPart.match(/fn-?(.*)$/);
                      const id = idMatch ? idMatch[1] : hashPart.replace("user-content-", "");
                      
                      // Try to find content by ID, or fallback to exact match
                      const content = footnoteMap[id] || footnoteMap[hashPart] || "";
                      return <FootnotePopup id={id} content={content}>{children}</FootnotePopup>;
                    }

                    const isInternal = hrefStr.startsWith("/w/") || hrefStr.startsWith("./") || (!hrefStr.startsWith("http") && hrefStr.startsWith("/"));
                    if (isInternal) {
                      return <Link href={hrefStr} className="text-sky-500 font-bold hover:underline">{children}</Link>;
                    }
                    
                    return <a href={hrefStr} target="_blank" rel="noopener noreferrer" className="text-sky-500 font-bold hover:underline">{children}</a>;
                  },
                  // Style the footnotes section at the bottom
                  section: ({ children, node, ...props }) => {
                    void node;
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
                  ol: ({ children, node, ...props }) => {
                    void node;
                    // Check if this OL is inside a footnotes section (via a wrapper or context, 
                    // but ReactMarkdown doesn't easily provide parent context here, 
                    // so we'll style all OLs slightly better or use a CSS-in-JS approach if needed.
                    // For now, let's just ensure list-style is visible.)
                    return <ol className="list-decimal list-inside space-y-2" {...props}>{children}</ol>;
                  },
                  li: ({ children, node, ...props }) => {
                    void node;
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

            {tocItems.length > 0 && (
              <aside className="order-first xl:order-last xl:sticky xl:top-24">
                <nav className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-gray-900">
                    <ListTree size={17} className="text-sky-600" />
                    목차
                  </div>
                  <ol className="space-y-1.5">
                    {tocItems.map((item) => (
                      <li key={item.id} className={item.level === 1 ? "" : item.level === 2 ? "pl-3" : "pl-6"}>
                        <a
                          href={`#${item.id}`}
                          className="block rounded-lg px-3 py-2 text-sm font-bold leading-snug text-gray-600 transition hover:bg-white hover:text-sky-600 focus:bg-white focus:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </aside>
            )}
          </div>
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
