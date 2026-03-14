import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/page-header';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F2F3F5]">
      <PageHeader
        breadcrumbs={[{ label: 'Q DevOps Platform' }, { label: '页面不存在' }]}
        title="页面不存在"
        description="当前访问地址无效，请检查链接或返回业务首页"
        action={(
          <button
            type="button"
            onClick={() => navigate('/business')}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E6EB] bg-white px-4 text-[#4E5969] transition-colors hover:border-[#1664FF] hover:text-[#1664FF]"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            <ArrowLeft size={14} />
            返回我的业务
          </button>
        )}
      />
      <div className="flex min-h-[50vh] flex-1 items-center justify-center px-4 text-center">
        <p className="m-0 text-[#86909C]" style={{ fontSize: 14 }}>
          未匹配到对应页面，请检查链接地址是否正确。
        </p>
      </div>
    </div>
  );
}
