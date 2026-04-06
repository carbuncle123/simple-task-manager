import type { ReactNode } from "react";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function linkify(text: string): ReactNode {
  const parts = text.split(URL_REGEX);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      // Reset lastIndex since we're reusing the regex
      URL_REGEX.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
