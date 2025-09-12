import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center">
          {/* Logo and Title */}
          <div className="mb-12">
            <div className="text-8xl mb-6">🎓</div>
            <h1 
              className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              BZ StudyPal
            </h1>
            <h2 className="text-2xl text-gray-600 mb-4">
              智能错题管理系统
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              双语版MVP错题管理与复习系统，帮助您高效管理和复习错题，提升学习效果。
            </p>
          </div>

          {/* Features Introduction */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">
                  📚 错题管理
                </h3>
                <p className="text-gray-600">
                  智能分类和标签管理
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">
                  📈 学习统计
                </h3>
                <p className="text-gray-600">
                  可视化的进度分析
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-blue-600 mb-2">
                  📝 复习计划
                </h3>
                <p className="text-gray-600">
                  个性化复习推荐
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-xl shadow-lg transition-colors duration-200 min-w-[200px] justify-center"
            >
              🔑 立即登录
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-lg font-medium rounded-xl shadow-lg transition-colors duration-200 min-w-[200px] justify-center"
            >
              👤 免费注册
            </Link>
          </div>

          {/* Version Information */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              版本 1.0.0 - MVP 测试版
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
