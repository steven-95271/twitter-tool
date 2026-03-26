import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: 'https://api.minimaxi.com/v1',
});

export async function extractInspirationContent(rawContent: string, type: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messages: any[];

  if (type === 'image') {
    messages = [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: rawContent,
            },
          },
          {
            type: 'text',
            text: '请分析这张图片，提取关键信息和观点，用中文回答。',
          },
        ],
      },
    ];
  } else if (type === 'link') {
    messages = [
      {
        role: 'user',
        content: `请访问并分析这个链接的内容，提取出关键信息和观点：${rawContent}`,
      },
    ];
  } else {
    messages = [
      {
        role: 'user',
        content: `请分析以下内容，提取关键观点和信息要点：\n\n${rawContent}`,
      },
    ];
  }

  const response = await client.chat.completions.create({
    model: 'MiniMax-M2.7',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || '';
}

export async function suggestTags(extractedText: string): Promise<string[]> {
  const response = await client.chat.completions.create({
    model: 'MiniMax-M2.7',
    messages: [
      {
        role: 'user',
        content: `根据以下内容，给出3-5个标签（只返回标签，用逗号分隔，不要其他内容）：\n\n${extractedText}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 100,
  });

  const content = response.choices[0]?.message?.content || '';
  return content.split(',').map(t => t.trim()).filter(Boolean);
}

export async function generateTweets(
  systemPrompt: string,
  inspirations: string,
  notes?: string
): Promise<string[]> {
  const userPrompt = `以下是我的灵感素材：
---
${inspirations}
---
${notes ? notes + '\n---\n' : ''}
请基于以上素材，用我的人设风格生成3个不同角度的推文版本。
每个版本控制在280字以内。
直接输出推文内容，不要加任何解释。
用---分隔三个版本。`;

  const response = await client.chat.completions.create({
    model: 'MiniMax-M2.7',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content || '';
  return content.split('---').map(t => t.trim()).filter(Boolean);
}

export default client;
