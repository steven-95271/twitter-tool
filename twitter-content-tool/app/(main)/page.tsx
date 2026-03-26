import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">欢迎使用 Twitter 内容工具</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/inspirations"
          className="p-6 rounded-lg border border-gray-800 bg-gray-900 hover:border-blue-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">📝 灵感库</h2>
          <p className="text-gray-500 text-sm">收集和整理灵感素材</p>
        </Link>

        <Link
          href="/personas"
          className="p-6 rounded-lg border border-gray-800 bg-gray-900 hover:border-blue-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">👤 人设管理</h2>
          <p className="text-gray-500 text-sm">创建和管理 Twitter 人设</p>
        </Link>

        <Link
          href="/generate"
          className="p-6 rounded-lg border border-gray-800 bg-gray-900 hover:border-blue-600 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">✨ 生成推文</h2>
          <p className="text-gray-500 text-sm">基于素材生成推文</p>
        </Link>
      </div>
    </div>
  );
}
