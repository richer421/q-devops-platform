import { Button, Empty } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BasePage } from '../../components/layout/page-container';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <BasePage
        breadcrumbs={[{ label: 'Q DevOps' }, { label: '页面不存在' }]}
        title="页面不存在"
        description="当前访问地址无效，请检查链接或返回业务首页"
        action={(
          <Button onClick={() => navigate('/business')} icon={<ArrowLeft size={14} />}>
            返回我的业务
          </Button>
        )}
      >
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description="未匹配到对应页面，请检查链接地址是否正确。" />
        </div>
    </BasePage>
  );
}
