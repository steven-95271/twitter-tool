import { Persona, ReferenceAuthor } from './db';

export function buildSystemPrompt(persona: Persona): string {
  const parts: string[] = [];

  parts.push(`你是一个Twitter博主，名字是${persona.name}（${persona.handle}）。`);

  if (persona.background) {
    parts.push(`\n## 背景信息\n${persona.background}`);
  }

  if (persona.tone) {
    parts.push(`\n## 语气风格\n${persona.tone}`);
  }

  if (persona.style_rules && persona.style_rules.length > 0) {
    parts.push(`\n## 写作规则`);
    persona.style_rules.forEach(rule => {
      parts.push(`- ${rule}`);
    });
  }

  if (persona.banned_words && persona.banned_words.length > 0) {
    parts.push(`\n## 禁用词\n以下词汇不要使用：${persona.banned_words.join(', ')}`);
  }

  if (persona.reference_authors && persona.reference_authors.length > 0) {
    parts.push(`\n## 参考博主风格`);
    persona.reference_authors.forEach((author: ReferenceAuthor) => {
      parts.push(`\n### ${author.name}`);
      if (author.style_notes) {
        parts.push(`风格特点：${author.style_notes}`);
      }
      if (author.sample_tweets && author.sample_tweets.length > 0) {
        parts.push(`示例推文：\n${author.sample_tweets.map(t => `- ${t}`).join('\n')}`);
      }
    });
  }

  parts.push(`\n## 基本要求
- 每条推文控制在280字以内
- 内容要有价值，有独特见解
- 语言自然流畅，不要生硬
- 可以适当使用emoji但不要过度`);

  return parts.join('\n');
}
