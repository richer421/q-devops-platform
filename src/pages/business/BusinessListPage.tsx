import { Button } from 'antd';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessDeleteModal } from '../../components/business/BusinessDeleteModal';
import { BusinessListPanel } from '../../components/business/BusinessListPanel';
import { BusinessModal, type BusinessFormValue } from '../../components/business/BusinessModal';
import { BasePage } from '../../components/layout/page-container';
import { businesses, type BusinessUnit } from '../../mock';

const emptyBusinessForm: BusinessFormValue = {
  name: '',
  desc: '',
  repoUrl: '',
};

export function BusinessListPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<BusinessUnit[]>(() => [...businesses]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const editingBusiness = editingId ? list.find((item) => item.id === editingId) : undefined;
  const deletingBusiness = deletingId ? list.find((item) => item.id === deletingId) : undefined;

  const handleCreate = (value: BusinessFormValue) => {
    setList((prev) => [
      {
        id: `bu-${Date.now()}`,
        name: value.name,
        desc: value.desc,
        repoUrl: value.repoUrl,
        status: 'active',
      },
      ...prev,
    ]);
    setCreateOpen(false);
  };

  const handleUpdate = (value: BusinessFormValue) => {
    if (!editingId) {
      return;
    }

    setList((prev) =>
      prev.map((item) => (item.id === editingId ? { ...item, ...value } : item)),
    );
    setEditingId(null);
  };

  const handleDelete = () => {
    if (!deletingId) {
      return;
    }

    setList((prev) => prev.filter((item) => item.id !== deletingId));
    setDeletingId(null);
  };

  return (
    <>
      <BasePage
        breadcrumbs={[{ label: 'Q DevOps' }, { label: '我的业务' }]}
        title="我的业务"
        description="统一管理业务的上下文信息，团队成员围绕同一业务视图展开协作"
        action={(
          <Button onClick={() => setCreateOpen(true)} type="primary" icon={<Plus size={15} />}>
            新建业务单元
          </Button>
        )}
        contentStyle={{ padding: 0 }}
      >
        <BusinessListPanel
          businesses={list}
          onOpenDetail={(id) => navigate(`/business/${id}`)}
          onEdit={(id) => setEditingId(id)}
          onDelete={(id) => setDeletingId(id)}
        />
      </BasePage>

      {createOpen && (
        <BusinessModal
          title="新建业务单元"
          initialValue={emptyBusinessForm}
          onConfirm={handleCreate}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {editingBusiness && (
        <BusinessModal
          title="编辑业务单元"
          initialValue={{
            name: editingBusiness.name,
            desc: editingBusiness.desc,
            repoUrl: editingBusiness.repoUrl,
          }}
          onConfirm={handleUpdate}
          onClose={() => setEditingId(null)}
        />
      )}

      {deletingBusiness && (
        <BusinessDeleteModal
          name={deletingBusiness.name}
          onConfirm={handleDelete}
          onClose={() => setDeletingId(null)}
        />
      )}
    </>
  );
}
