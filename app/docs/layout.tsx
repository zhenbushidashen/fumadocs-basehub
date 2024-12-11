import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { basehub } from "basehub";
import { PageTree } from "fumadocs-core/server";
import { draftMode } from "next/headers";

export default async function Layout({ children }: { children: ReactNode }) {
  const { documentation } = await basehub({
    draft: (await draftMode()).isEnabled,
  }).query({
    documentation: { items: { slug: true, _title: true, category: true } },
  });

  const items: PageTree.Node[] = [];

  for (const item of documentation.items) {
    let idx = items.length;

    if (item.category && item.category !== "Root") {
      idx = items.findIndex((parent) => parent.name === item.category);

      if (idx === -1) {
        items.push({
          type: "separator",
          name: item.category,
        });

        idx = items.length;
      }
    }

    items.splice(idx, 0, {
      type: "page",
      name: item._title,
      url: item.slug ? `/docs/${item.slug}` : "/docs",
    });
  }

  return (
    <DocsLayout
      tree={{
        name: "Docs",
        children: items,
      }}
      {...baseOptions}
    >
      {children}
    </DocsLayout>
  );
}
