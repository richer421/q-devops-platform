import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type BusinessFormValue = {
  name: string;
  desc: string;
  repoUrl: string;
};

type BusinessModalProps = {
  title: string;
  initialValue: BusinessFormValue;
  confirmText?: string;
  onConfirm: (value: BusinessFormValue) => void;
  onClose: () => void;
};

export function BusinessModal({
  title,
  initialValue,
  confirmText = '确认',
  onConfirm,
  onClose,
}: BusinessModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F2F3F5] px-6 py-4">
          <span className="text-[#1D2129]" style={{ fontSize: 16, fontWeight: 600 }}>
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#86909C] transition-colors hover:text-[#1D2129]"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label
              htmlFor="business-name"
              className="mb-1.5 block text-[#1D2129]"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              名称 <span className="text-[#F53F3F]">*</span>
            </label>
            <input
              id="business-name"
              value={value.name}
              onChange={(event) => setValue((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="例：api-server"
              className="h-9 w-full rounded-lg border border-[#E5E6EB] px-3 text-[#1D2129] outline-none transition-colors placeholder:text-[#C9CDD4] focus:border-[#1664FF]"
              style={{ fontSize: 13 }}
            />
          </div>

          <div>
            <label
              htmlFor="business-desc"
              className="mb-1.5 block text-[#1D2129]"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              描述
            </label>
            <textarea
              id="business-desc"
              value={value.desc}
              onChange={(event) => setValue((prev) => ({ ...prev, desc: event.target.value }))}
              rows={3}
              placeholder="简要描述该业务单元的用途"
              className="w-full resize-none rounded-lg border border-[#E5E6EB] px-3 py-2 text-[#1D2129] outline-none transition-colors placeholder:text-[#C9CDD4] focus:border-[#1664FF]"
              style={{ fontSize: 13 }}
            />
          </div>

          <div>
            <label
              htmlFor="business-repo"
              className="mb-1.5 block text-[#1D2129]"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              代码库地址
            </label>
            <input
              id="business-repo"
              value={value.repoUrl}
              onChange={(event) => setValue((prev) => ({ ...prev, repoUrl: event.target.value }))}
              placeholder="https://github.com/org/repo"
              className="h-9 w-full rounded-lg border border-[#E5E6EB] px-3 text-[#1D2129] outline-none transition-colors placeholder:text-[#C9CDD4] focus:border-[#1664FF]"
              style={{ fontSize: 13 }}
            />
          </div>
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
            onClick={() =>
              onConfirm({
                name: value.name.trim(),
                desc: value.desc.trim(),
                repoUrl: value.repoUrl.trim(),
              })
            }
            disabled={!value.name.trim()}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1664FF] px-4 text-white transition-colors hover:bg-[#0E50D3] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            <Check size={14} />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
