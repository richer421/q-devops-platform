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
      <div className="border-b border-[#E5E6EB] bg-white px-6 py-4">
        <div className="mb-2 flex items-center gap-1">
          <span className="text-[#C9CDD4]" style={{ fontSize: 12 }}>
            AppDelivery
          </span>
          <span className="text-[#C9CDD4]" style={{ fontSize: 12 }}>
            /
          </span>
          <span className="text-[#86909C]" style={{ fontSize: 12 }}>
            业务中心
          </span>
        </div>
      </div>
      <BusinessToolbar
        value={keyword}
        onChange={setKeyword}
        count={filteredBusinesses.length}
        onCreate={() => setCreateOpen(true)}
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
