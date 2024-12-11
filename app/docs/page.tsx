import { basehub } from "basehub";
import { RichText } from "basehub/react-rich-text";
import { Card, Cards } from "fumadocs-ui/components/card";
import { DocsBody, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { draftMode } from "next/headers";

export default async function Page() {
  const { documentation } = await basehub({
    draft: (await draftMode()).isEnabled,
  }).query({
    documentation: {
      items: {
        _slug: true,
        _title: true,
        richText: {
          json: {
            content: true,
          },
        },
      },
    },
  });
  const [home, ...items] = documentation.items;

  return (
    <DocsPage>
      <DocsTitle>Introduction</DocsTitle>
      <DocsBody className="text-sm">
        <RichText content={home.richText?.json.content} />
        <Cards>
          {items.map((item) => (
            <Card
              key={item._slug}
              href={`/docs/${item._slug}`}
              title={item._title}
            />
          ))}
        </Cards>
      </DocsBody>
    </DocsPage>
  );
}
