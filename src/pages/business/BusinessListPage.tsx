import { Button, message } from 'antd';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BusinessDeleteModal,
  BusinessListPanel,
  BusinessModal,
  type BusinessFormValue,
  type BusinessTableRow,
} from '@/components/business/business-unit';
import { BasePage } from '../../components/layout/page-container';
import {
  createBusinessUnit,
  deleteBusinessUnit,
  listBusinessUnits,
  updateBusinessUnit,
  type BusinessUnitRecord,
} from '@/utils/api/metahub/business-unit';
import { findProjectCatalogItem, projectCatalog } from '@/utils/project-catalog';

const emptyBusinessForm: BusinessFormValue = {
  name: '',
  desc: '',
  projectId: projectCatalog[0]?.id ?? 0,
};

export function BusinessListPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<BusinessUnitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const editingBusiness = editingId ? list.find((item) => item.id === editingId) : undefined;
  const deletingBusiness = deletingId ? list.find((item) => item.id === deletingId) : undefined;

  const tableRows = useMemo<BusinessTableRow[]>(
    () =>
      list.map((item) => {
        const fallbackProject = findProjectCatalogItem(item.projectId);
        return {
          id: String(item.id),
          name: item.name,
          desc: item.description,
          repoUrl: item.project?.repoUrl ?? fallbackProject?.repoUrl ?? '',
          projectName: item.project?.name ?? fallbackProject?.name ?? '未知代码库',
          projectId: item.projectId,
          status: 'active',
        };
      }),
    [list],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void listBusinessUnits({
      page,
      pageSize,
      keyword,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }
        setList(result.items);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error(error);
        void message.error('业务单元列表加载失败');
        setList([]);
        setTotal(0);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [keyword, page, pageSize, reloadToken]);

  const handleCreate = async (value: BusinessFormValue) => {
    try {
      await createBusinessUnit({
        name: value.name,
        description: value.desc,
        projectId: value.projectId,
      });
      setCreateOpen(false);
      setPage(1);
      setReloadToken((current) => current + 1);
    } catch (error) {
      console.error(error);
      void message.error('创建业务单元失败');
    }
  };

  const handleUpdate = async (value: BusinessFormValue) => {
    if (!editingBusiness) {
      return;
    }

    try {
      await updateBusinessUnit(editingBusiness.id, {
        name: value.name,
        description: value.desc,
      });
      setEditingId(null);
      setReloadToken((current) => current + 1);
    } catch (error) {
      console.error(error);
      void message.error('更新业务单元失败');
    }
  };

  const handleDelete = async () => {
    if (!deletingBusiness) {
      return;
    }

    try {
      await deleteBusinessUnit(deletingBusiness.id);
      setDeletingId(null);
      setReloadToken((current) => current + 1);
    } catch (error) {
      console.error(error);
      void message.error(error instanceof Error ? error.message : '删除业务单元失败');
    }
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
          businesses={tableRows}
          keyword={keyword}
          page={page}
          pageSize={pageSize}
          total={total}
          loading={loading}
          onOpenDetail={(id) => {
            const business = list.find((item) => String(item.id) === id);
            navigate(`/business/${id}`, {
              state: business
                ? {
                    businessName: business.name,
                    businessDescription: business.description,
                    projectId: business.projectId,
                  }
                : undefined,
            });
          }}
          onEdit={(id) => setEditingId(Number(id))}
          onDelete={(id) => setDeletingId(Number(id))}
          onKeywordChange={(nextKeyword) => {
            setKeyword(nextKeyword);
            setPage(1);
          }}
          onPageChange={(nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          }}
        />
      </BasePage>

      {createOpen && (
        <BusinessModal
          title="新建业务单元"
          mode="create"
          initialValue={emptyBusinessForm}
          onConfirm={handleCreate}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {editingBusiness && (
        <BusinessModal
          title="编辑业务单元"
          mode="edit"
          initialValue={{
            name: editingBusiness.name,
            desc: editingBusiness.description,
            projectId: editingBusiness.projectId,
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
