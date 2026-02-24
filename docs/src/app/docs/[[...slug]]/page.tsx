import { getPageImage, getLLMText, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { DocActions } from '@/components/docs/DocActions';
import { LearningCompletionMarker, LearningProgressBar } from '@/components/learning';
import {
  BreadcrumbSchema,
  ArticleSchema,
} from '@/components/seo/StructuredData';
import { getSiteUrl } from '@/lib/site-url';
import { getLearningTracks } from '@/lib/learning-pages';

const BASE_URL = getSiteUrl();

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdown = await getLLMText(page);

  // Get file path for GitHub link from slugs (e.g., "getting-started/installation.mdx")
  // Slugs like ['getting-started', 'installation'] -> 'getting-started/installation.mdx'
  const filePath = page.slugs.length > 0
    ? `${page.slugs.join('/')}.mdx`
    : 'index.mdx';

  // Build breadcrumb items for SEO
  const breadcrumbItems = [
    { name: 'Home', url: BASE_URL },
    { name: 'Docs', url: `${BASE_URL}/docs` },
    ...page.slugs.map((slug, index) => ({
      name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
      url: `${BASE_URL}/docs/${page.slugs.slice(0, index + 1).join('/')}`,
    })),
  ];

  const pageUrl = `${BASE_URL}/docs/${page.slugs.join('/')}`;
  const isLearningPage = page.slugs[0] === 'learning' && page.slugs.length >= 2;
  const learningTrack = isLearningPage
    ? getLearningTracks().find((track) => track.id === page.slugs[1])
    : undefined;
  const currentLearningSlug = isLearningPage ? page.slugs.join('/') : '';

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <ArticleSchema
        title={page.data.title}
        description={page.data.description ?? ''}
        url={pageUrl}
      />
      <DocsPage toc={page.data.toc} full={page.data.full}>
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
        <DocActions
          markdown={markdown}
          filePath={filePath}
          title={page.data.title}
        />
        {learningTrack && (
          <LearningProgressBar
            currentSlug={currentLearningSlug}
            track={learningTrack}
          />
        )}
        <DocsBody>
          <MDX
            components={getMDXComponents({
              // this allows you to link to other pages with relative file paths
              a: createRelativeLink(source, page),
            })}
          />
          {learningTrack && (
            <LearningCompletionMarker currentSlug={currentLearningSlug} />
          )}
        </DocsBody>
      </DocsPage>
    </>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/docs/[[...slug]]'>,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
