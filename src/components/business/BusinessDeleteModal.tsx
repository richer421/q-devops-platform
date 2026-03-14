import { Trash2 } from 'lucide-react';

type BusinessDeleteModalProps = {
  name: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function BusinessDeleteModal({
  name,
  onConfirm,
  onClose,
}: BusinessDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pb-4 pt-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFECE8]">
              <Trash2 size={18} className="text-[#F53F3F]" />
            </div>
            <span className="text-[#1D2129]" style={{ fontSize: 16, fontWeight: 600 }}>
              确认删除
            </span>
          </div>
          <p className="m-0 text-[#4E5969]" style={{ fontSize: 13, lineHeight: 1.6 }}>
            确定要删除业务单元 <strong className="text-[#1D2129]">{name}</strong> 吗？该操作不可撤销，关联的配置数据也将一并移除。
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#F2F3F5] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-[#E5E6EB] bg-white px-4 text-[#4E5969] transition-colors hover:border-[#1664FF] hover:text-[#1664FF]"
            style={{ fontSize: 13 }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 rounded-lg bg-[#F53F3F] px-4 text-white transition-colors hover:bg-[#D93025]"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}
