import { Fragment, type ReactNode } from "react";

/**
 * Renders the slice of Markdown the assistant actually writes: headings,
 * paragraphs, bullet and numbered lists (one level of nesting), rules, bold,
 * italic, inline code and links.
 *
 * Hand-rolled instead of a dependency. It builds React elements rather than an
 * HTML string, so nothing the model writes can inject markup, and it copes with
 * half-finished input because it re-renders on every streamed chunk.
 */

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "list"; ordered: boolean; start: number; items: ListItem[] }
  | { kind: "rule" };

interface ListItem {
  text: string;
  children: string[];
}

const HEADING = /^#{1,6}\s+(.*)$/;
const LIST_ITEM = /^(\s*)(?:[-*+]|(\d+)[.)])\s+(.*)$/;
const RULE = /^\s*([-*_])(?:\s*\1){2,}\s*$/;
const INDENTED = /^\s{2,}\S/;

/**
 * Bold, inline code, [text](url), bare URL, italic — tried in that order.
 * Only http(s) links match, so a `javascript:` href can never be produced.
 */
const INLINE =
  /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"])|\*(?![\s*])(.+?)\*/g;

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  // A blank line ends a paragraph but not a list: models often leave one
  // between numbered items, and that is still a single list.
  let paragraphOpen = false;

  for (const line of source.split("\n")) {
    const last = blocks.at(-1);

    if (!line.trim()) {
      paragraphOpen = false;
      continue;
    }

    // Before list items, since "* * *" would otherwise read as a bullet.
    if (RULE.test(line)) {
      blocks.push({ kind: "rule" });
      paragraphOpen = false;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", text: heading[1] });
      paragraphOpen = false;
      continue;
    }

    const item = LIST_ITEM.exec(line);
    if (item) {
      const [, indent, number, text] = item;
      const ordered = number !== undefined;

      if (last?.kind === "list") {
        const parent = last.items[last.items.length - 1];
        if (indent.length >= 2) {
          parent.children.push(text);
          continue;
        }
        if (last.ordered === ordered) {
          last.items.push({ text, children: [] });
          continue;
        }
      }

      blocks.push({
        kind: "list",
        ordered,
        start: ordered ? Number(number) : 1,
        items: [{ text, children: [] }],
      });
      paragraphOpen = false;
      continue;
    }

    // An indented line under a list item continues that item.
    if (last?.kind === "list" && INDENTED.test(line)) {
      last.items[last.items.length - 1].text += `\n${line.trim()}`;
      continue;
    }

    if (last?.kind === "paragraph" && paragraphOpen) {
      last.lines.push(line.trim());
    } else {
      blocks.push({ kind: "paragraph", lines: [line.trim()] });
      paragraphOpen = true;
    }
  }

  return blocks;
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-words font-medium text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
    >
      {children}
    </a>
  );
}

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > cursor) out.push(text.slice(cursor, start));

    const [whole, bold, code, linkText, linkHref, bareUrl, italic] = match;
    if (bold !== undefined) {
      out.push(
        <strong key={start} className="font-semibold">
          {renderInline(bold)}
        </strong>,
      );
    } else if (code !== undefined) {
      out.push(
        <code key={start} className="rounded-md bg-sunken px-1.5 py-0.5 font-mono text-[0.875em]">
          {code}
        </code>,
      );
    } else if (linkText !== undefined) {
      out.push(
        <ExternalLink key={start} href={linkHref}>
          {linkText}
        </ExternalLink>,
      );
    } else if (bareUrl !== undefined) {
      out.push(
        <ExternalLink key={start} href={bareUrl}>
          {bareUrl}
        </ExternalLink>,
      );
    } else {
      out.push(<em key={start}>{renderInline(italic)}</em>);
    }

    cursor = start + whole.length;
  }

  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

/** Keeps the model's single line breaks, which it uses for address-style detail lines. */
function Lines({ text }: { text: string }) {
  return text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {renderInline(line)}
    </Fragment>
  ));
}

/**
 * A last line holding only "3." or "-" is a list marker whose text hasn't
 * arrived yet. Rendering it would flash a stray paragraph on every item.
 */
const DANGLING_MARKER = /(?:^|\n)[ \t]*(?:\d+[.)]?|[-*+]|#{1,6})[ \t]*$/;

export default function Markdown({
  source,
  streaming = false,
}: {
  source: string;
  /** True while the reply is still arriving. */
  streaming?: boolean;
}) {
  const blocks = parseBlocks(streaming ? source.replace(DANGLING_MARKER, "") : source);

  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading":
            return (
              <h3 key={i} className="mt-1 font-semibold">
                {renderInline(block.text)}
              </h3>
            );
          case "paragraph":
            return (
              <p key={i} className="break-words">
                <Lines text={block.lines.join("\n")} />
              </p>
            );
          case "rule":
            return <hr key={i} className="border-line" />;
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List
                key={i}
                start={block.ordered ? block.start : undefined}
                className={`space-y-2 pl-5 marker:text-muted ${
                  block.ordered ? "list-decimal" : "list-disc"
                }`}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="break-words pl-1">
                    <Lines text={item.text} />
                    {item.children.length > 0 && (
                      <ul className="mt-1 list-[circle] space-y-1 pl-4 text-muted marker:text-line-strong">
                        {item.children.map((child, k) => (
                          <li key={k}>
                            <Lines text={child} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </List>
            );
          }
        }
      })}
    </div>
  );
}
