import React, { useEffect } from 'react';
import { MarketplaceBook, Chapter } from '../../types';

interface SeoStructuredDataProps {
  type: 'landing' | 'book' | 'chapter';
  book?: MarketplaceBook;
  chapter?: Chapter;
  platformName?: string;
  url?: string;
}

export const SeoStructuredData: React.FC<SeoStructuredDataProps> = ({
  type,
  book,
  chapter,
  platformName = 'ebook osera ai',
  url
}) => {
  useEffect(() => {
    // 1. Update Title & Meta Tags dynamically
    const currentUrl = url || window.location.href;
    let pageTitle = platformName;
    let pageDescription = 'منصة ebook osera ai للتعلم التفاعلي الذكي والكتب والمناهج الدراسية المدعومة بالذكاء الاصطناعي';
    let ogImage = 'https://www.ebook.osera-ai.com/og-cover.png';

    if (type === 'book' && book) {
      pageTitle = `${book.title} | ${book.stage || book.category || 'مقرر دراسي'} - ${platformName}`;
      pageDescription = book.description || `مقرر ${book.title} تفاعلي شامل شرح مبسّط، بنك أسئلة، بودكاست وملخصات ذكية.`;
      if (book.coverUrl) ogImage = book.coverUrl;
    } else if (type === 'chapter' && book && chapter) {
      pageTitle = `${chapter.title} - ${book.title} | ${platformName}`;
      pageDescription = chapter.summary || `شرح درس ${chapter.title} من مقرر ${book.title} مع بنك أسئلة ونماذج امتحانات تفاعلية.`;
      if (book.coverUrl) ogImage = book.coverUrl;
    }

    document.title = pageTitle;

    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('name', 'description', pageDescription);
    setMetaTag('name', 'keywords', `${book?.title || ''}, ${book?.stage || ''}, ${chapter?.title || ''}, كتب تعليمية, مذكرات دراسية, مراجعات وامتحانات, ذكاء اصطناعي تعليمي, ${platformName}`);
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDescription);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:type', type === 'landing' ? 'website' : 'article');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDescription);
    setMetaTag('name', 'twitter:image', ogImage);

    // 2. Build Schema.org JSON-LD structured data for Google & GEO (Perplexity, ChatGPT, Gemini)
    const jsonLdScripts: any[] = [];

    if (type === 'landing') {
      jsonLdScripts.push({
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        'name': platformName,
        'url': currentUrl,
        'description': pageDescription,
        'logo': ogImage,
        'sameAs': [
          'https://facebook.com/osera.ai',
          'https://twitter.com/osera_ai'
        ]
      });

      jsonLdScripts.push({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': platformName,
        'url': currentUrl,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': `${currentUrl}?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      });
    } else if (book) {
      const isCurriculum = book.isCurriculum || book.gradeLevel || book.educationStage;

      // Primary Course / Book Schema
      if (isCurriculum) {
        jsonLdScripts.push({
          '@context': 'https://schema.org',
          '@type': 'Course',
          'name': book.title,
          'description': book.description,
          'provider': {
            '@type': 'Organization',
            'name': platformName,
            'sameAs': window.location.origin
          },
          'educationalLevel': book.gradeLevel || book.educationStage || 'General',
          'inLanguage': 'ar',
          'learningResourceType': 'Interactive Curriculum & Practice'
        });
      } else {
        jsonLdScripts.push({
          '@context': 'https://schema.org',
          '@type': 'Book',
          'name': book.title,
          'author': {
            '@type': 'Person',
            'name': book.author || 'Osera Scholar'
          },
          'description': book.description,
          'inLanguage': 'ar',
          'image': book.coverUrl
        });
      }

      // Breadcrumb Schema
      jsonLdScripts.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'الرئيسية',
            'item': window.location.origin
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': book.stage || book.category || 'المكتبة',
            'item': `${window.location.origin}/marketplace`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': book.title,
            'item': `${window.location.origin}/book/${book.id}`
          },
          ...(chapter ? [{
            '@type': 'ListItem',
            'position': 4,
            'name': chapter.title,
            'item': `${window.location.origin}/book/${book.id}?tab=read`
          }] : [])
        ]
      });

      // FAQPage Schema (if chapter has exam traps or tips or FAQs)
      const faqItems: any[] = [];
      if (chapter?.examTraps && chapter.examTraps.length > 0) {
        chapter.examTraps.forEach((trap: string, idx: number) => {
          faqItems.push({
            '@type': 'Question',
            'name': `ما هي أهم التنبيهات والأخطاء الشائعة في درس ${chapter.title}؟ (#${idx + 1})`,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': trap
            }
          });
        });
      }

      if (faqItems.length > 0) {
        jsonLdScripts.push({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          'mainEntity': faqItems
        });
      }

      // Quiz Schema (if questions are available)
      if (chapter?.questions && chapter.questions.length > 0) {
        jsonLdScripts.push({
          '@context': 'https://schema.org',
          '@type': 'Quiz',
          'name': `اختبار وتقييم تفاعلي: ${chapter.title}`,
          'about': {
            '@type': 'Thing',
            'name': book.title
          },
          'hasPart': chapter.questions.slice(0, 10).map((q: any) => ({
            '@type': 'Question',
            'name': q.question,
            'educationalLevel': q.difficulty || 'intermediate',
            'suggestedAnswer': q.options ? q.options.map((opt: string, optIdx: number) => ({
              '@type': 'Answer',
              'text': opt,
              'position': optIdx + 1
            })) : undefined,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': q.options && q.correctOptionIndex !== undefined ? q.options[q.correctOptionIndex] : (q.modelAnswer || 'إجابة نموذجية')
            }
          }))
        });
      }
    }

    // Inject JSON-LD into DOM
    let scriptTag = document.getElementById('osera-jsonld-script') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'osera-jsonld-script';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(jsonLdScripts.length === 1 ? jsonLdScripts[0] : jsonLdScripts);

    return () => {
      const tag = document.getElementById('osera-jsonld-script');
      if (tag) tag.remove();
    };
  }, [type, book, chapter, platformName, url]);

  // Hidden Semantic GEO Block for AI Crawlers (Perplexity, ChatGPT, Claude)
  if (!book) return null;

  return (
    <div
      className="sr-only"
      aria-hidden="true"
      data-geo-entity="osera-curriculum"
      data-author={book.author || 'Osera AI'}
      data-level={book.gradeLevel || book.educationStage || 'General'}
    >
      <h2>{book.title}</h2>
      <p>{book.description}</p>
      {chapter && (
        <article data-geo-chapter={chapter.title}>
          <h3>{chapter.title}</h3>
          {chapter.summary && <p className="geo-summary">{chapter.summary}</p>}
          {chapter.learningObjectives && chapter.learningObjectives.length > 0 && (
            <ul>
              {chapter.learningObjectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          )}
          {chapter.examTraps && chapter.examTraps.length > 0 && (
            <div className="geo-exam-traps">
              {chapter.examTraps.map((trap, i) => (
                <blockquote key={i}>{trap}</blockquote>
              ))}
            </div>
          )}
        </article>
      )}
    </div>
  );
};
