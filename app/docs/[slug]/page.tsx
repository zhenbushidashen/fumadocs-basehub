import { Node } from "basehub/react-rich-text";
import { RichText } from "@/components/rich-text";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { basehub } from "basehub";
import { draftMode } from "next/headers";
import { TOCItemType } from "fumadocs-core/server";

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;

  const { documentation } = await basehub({
    draft: (await draftMode()).isEnabled,
  }).query({
    documentation: {
      __args: {
        filter: {
          slug: {
            eq: params.slug,
          },
        },
      },
      items: {
        richText: {
          json: {
            content: true,
            toc: true,
          },
        },
        _title: true,
      },
    },
  });

  const page = documentation.items.at(0);
  if (!page) notFound();

  const tocList: {
    type: "listItem";
    content: Node[];
  }[] = page.richText?.json.toc.at(0)?.content ?? [];

  const toc: TOCItemType[] = [];
  for (const item of tocList) {
    const nodes = findTextNode(item.content[0]);

    for (const node of nodes) {
      const mark = findLinkMark(node);
      if (!mark) continue;

      toc.push({
        depth: mark.depth,
        title: (
          <RichText
            content={[node]}
            // @ts-expect-error -- jsx
            components={{
              a: (props) => <span {...props} />,
            }}
          />
        ),
        url: mark.href,
      });
    }
  }

  return (
    <DocsPage toc={toc}>
      <DocsTitle>{page._title}</DocsTitle>
      <DocsBody className="text-sm">
        <RichText content={page.richText?.json.content} />
      </DocsBody>
    </DocsPage>
  );
}

function findTextNode(n: Node): Extract<Node, { type: "text" }>[] {
  if (n.type === "text") {
    return [n];
  }

  return n.content?.flatMap(findTextNode) ?? [];
}

function findLinkMark(n: Node):
  | {
      href: string;
      depth: number;
      target: string;
    }
  | undefined {
  const prefix = "toc-link-h";

  if (n.type === "text") {
    const mark = n.marks?.find((m) => m.type === "link");

    if (mark)
      return {
        depth: Number(
          mark.attrs.class
            .split(" ")
            .find((name) => name.startsWith(prefix))
            ?.slice(prefix.length) ?? 1
        ),
        href: mark.attrs.href,
        target: mark.attrs.target,
      };
  }

  for (const c of n.content ?? []) {
    const result = findLinkMark(c);

    if (result) return result;
  }
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const { documentation } = await basehub({
    draft: (await draftMode()).isEnabled,
  }).query({
    documentation: {
      __args: {
        filter: {
          slug: {
            eq: params.slug,
          },
        },
        first: 1,
      },
      items: {
        _title: true,
        category: true,
      },
    },
  });
  const page = documentation.items.at(0);
  if (!page) notFound();

  return {
    title: page._title,
    description: page.category,
  };
}
