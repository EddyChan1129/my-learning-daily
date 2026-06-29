import type { ReactNode } from "react";

type Copy = {
  zh: string;
  en: string;
};

export function bilingual(copy: Copy): ReactNode {
  return (
    <>
      <span>{copy.zh}</span>
      <span className="mt-0.5 block text-xs font-bold text-neutral-500">
        {copy.en}
      </span>
    </>
  );
}
