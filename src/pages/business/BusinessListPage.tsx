import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BusinessDeleteModal,
} from '../../components/business/BusinessDeleteModal';
import {
  BusinessModal,
  type BusinessFormValue,
} from '../../components/business/BusinessModal';
import { BusinessTable } from '../../components/business/BusinessTable';
import { BusinessToolbar } from '../../components/business/BusinessToolbar';
import { PageHeader } from '../../components/layout/page-header';
import { businesses, type BusinessUnit } from '../../data';

const emptyBusinessForm: BusinessFormValue = {
  name: '',
  desc: '',
  repoUrl: '',
};

export function BusinessListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<BusinessUnit[]>(() => [...businesses]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredBusinesses = useMemo(
    () =>
      list.filter(
        (business) =>
          business.name.toLowerCase().includes(keyword.toLowerCase()) ||
          business.desc.toLowerCase().includes(keyword.toLowerCase()),
      ),
    [keyword, list],
  );

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
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumbs={[{ label: 'Q DevOps Platform' }, { label: '我的业务' }]}
        title="我的业务"
        description="统一管理业务的上下文信息，团队成员围绕同一业务视图展开协作"
        action={(
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1664FF] px-4 text-white transition-colors hover:bg-[#0E50D3]"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            <Plus size={15} />
            新建业务单元
          </button>
        )}
        footer={(
          <BusinessToolbar
            value={keyword}
            onChange={setKeyword}
            count={filteredBusinesses.length}
          />
        )}
      />
      <BusinessTable
        businesses={filteredBusinesses}
        onOpenDetail={(id) => navigate(`/business/${id}`)}
        onEdit={(id) => setEditingId(id)}
        onDelete={(id) => setDeletingId(id)}
      />

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
    </div>
  );
}
