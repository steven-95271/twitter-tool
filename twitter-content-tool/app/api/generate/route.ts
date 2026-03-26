import { NextRequest, NextResponse } from 'next/server';
import { personaDb, inspirationDb, Inspiration, InspirationAttachment } from '@/lib/db';
import { generateTweets, extractTextContent, suggestTags, analyzeImage } from '@/lib/llm';
import { buildSystemPrompt } from '@/lib/prompt-builder';
import { fetchLinkContent } from '@/lib/link-fetcher';
import OpenAI from 'openai';

const MAX_IMAGE_SIZE = 12 * 1024 * 1024;

const kimiClient = new OpenAI({
  apiKey: 'sk-kimi-NIaXNkyMNMdVQU0rpnyHAoC1Qv0VKNwyhcPM401siz8Ad8iLxRAxr4Zyj7g4C60P',
  baseURL: 'https://api.moonshot.cn/v1',
});

async function analyzeImageWithKimi(imageBase64: string): Promise<string> {
  const response = await kimiClient.chat.completions.create({
    model: 'moonshot-v1-32k',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageBase64,
            },
          },
          {
            type: 'text',
            text: '请分析这张图片，提取关键信息和观点，用中文回答。',
          },
        ],
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personaId, inspirationIds, notes } = body;

    if (!personaId) {
      return NextResponse.json({ error: 'Persona ID is required' }, { status: 400 });
    }

    if (!inspirationIds || inspirationIds.length === 0) {
      return NextResponse.json({ error: 'At least one inspiration is required' }, { status: 400 });
    }

    const persona = personaDb.getById(Number(personaId));
    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    const inspirations = inspirationIds.map((id: number) => inspirationDb.getById(id)).filter((insp: Inspiration | null): insp is Inspiration => insp !== null);

    const systemPrompt = persona.system_prompt || buildSystemPrompt(persona);

    const inspirationTexts = inspirations.map((insp: Inspiration) => {
      let text = insp.raw_content;
      if (insp.attachments) {
        if (insp.attachments.images && insp.attachments.images.length > 0) {
          text += '\n\n【图片内容】' + (insp.extracted_text || '');
        }
        if (insp.attachments.links && insp.attachments.links.length > 0) {
          text += '\n\n【链接内容】' + insp.attachments.links.map(l => l.title ? `${l.title}: ${l.url}` : l.url).join(', ');
        }
        if (insp.attachments.files && insp.attachments.files.length > 0) {
          text += '\n\n【附件内容】' + insp.attachments.files.map(f => f.content || `[${f.name}]`).join('\n');
        }
      }
      return text;
    }).join('\n\n');

    const tweets = await generateTweets(systemPrompt, inspirationTexts, notes);

    inspirations.forEach((insp: Inspiration) => {
      inspirationDb.incrementUsedCount(insp.id!);
    });

    return NextResponse.json({ tweets });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Failed to generate tweets' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawContent, source, attachments } = body;

    if (!rawContent || !rawContent.trim()) {
      return NextResponse.json({ error: '文字内容是必填的' }, { status: 400 });
    }

    const processedAttachments: InspirationAttachment = {
      images: [],
      links: [],
      files: [],
    };

    if (attachments) {
      if (attachments.images && Array.isArray(attachments.images)) {
        for (const img of attachments.images) {
          if (img.startsWith('data:image')) {
            const size = Buffer.from(img.split(',')[1] || '', 'base64').length;
            if (size > MAX_IMAGE_SIZE) {
              return NextResponse.json({ error: `图片大小不能超过12MB` }, { status: 400 });
            }
            processedAttachments.images.push(img);
          }
        }
      }

      if (attachments.links && Array.isArray(attachments.links)) {
        for (const link of attachments.links) {
          const url = typeof link === 'string' ? link : link.url;
          if (!url) continue;
          
          try {
            const preview = await fetchLinkContent(url);
            if (!preview.title && !preview.description) {
              return NextResponse.json({ 
                error: `链接无法访问或内容为空: ${url}` 
              }, { status: 400 });
            }
            processedAttachments.links.push({
              url,
              title: preview.title,
            });
          } catch (linkError: any) {
            console.error('Link fetch failed:', linkError);
            return NextResponse.json({ 
              error: `链接抓取失败: ${url} - ${linkError?.message || '未知错误'}` 
            }, { status: 500 });
          }
        }
      }

      if (attachments.files && Array.isArray(attachments.files)) {
        for (const file of attachments.files) {
          if (file.content) {
            processedAttachments.files.push({
              name: file.name,
              type: file.type || 'application/pdf',
              content: file.content,
            });
          }
        }
      }
    }

    let extractedText = rawContent;

    if (processedAttachments.images.length > 0) {
      const imageAnalysisResults: string[] = [];
      for (const img of processedAttachments.images) {
        try {
          let result = await analyzeImage(img).catch(async () => {
            return await analyzeImageWithKimi(img);
          });
          imageAnalysisResults.push(result);
        } catch (imageError: any) {
          console.error('Image analysis failed:', imageError);
          return NextResponse.json({ 
            error: `图片分析失败: ${imageError?.message || '未知错误'}` 
          }, { status: 500 });
        }
      }
      if (imageAnalysisResults.length > 0) {
        extractedText += '\n\n【图片分析】\n' + imageAnalysisResults.join('\n');
      }
    }

    if (processedAttachments.files.length > 0) {
      extractedText += '\n\n【文档内容】\n' + processedAttachments.files.map(f => f.content).filter(Boolean).join('\n\n');
    }

    const finalExtractedText = await extractTextContent(extractedText);
    const tags = await suggestTags(finalExtractedText);

    const id = inspirationDb.create({
      raw_content: rawContent,
      extracted_text: finalExtractedText,
      tags,
      source,
      attachments: processedAttachments,
    });

    const inspiration = inspirationDb.getById(Number(id));
    return NextResponse.json(inspiration, { status: 201 });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({ error: 'Failed to process inspiration' }, { status: 500 });
  }
}
