import type { CSSProperties, ReactNode } from 'react';

type TablePanelShellProps = {
  isEmpty: boolean;
  header?: ReactNode;
  children: ReactNode;
  containerStyle?: CSSProperties;
  scopeAttrName?: string;
};

const baseContainerStyle: CSSProperties = {
  height: '100%',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#fff',
  overflow: 'hidden',
};

const contentStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  boxSizing: 'border-box',
  overflow: 'hidden',
};

export function TablePanelShell({
  isEmpty,
  header,
  children,
  containerStyle,
  scopeAttrName,
}: TablePanelShellProps) {
  const scopeAttr = scopeAttrName
    ? ({ [scopeAttrName]: 'true' } as Record<string, string>)
    : undefined;

  return (
    <div
      {...scopeAttr}
      data-table-shell="true"
      data-empty={isEmpty ? 'true' : 'false'}
      style={{ ...baseContainerStyle, ...containerStyle }}
    >
      {header}
      <div style={contentStyle}>{children}</div>
      <style>{`
        [data-table-shell='true'] .ant-table-wrapper,
        [data-table-shell='true'] .ant-spin-nested-loading,
        [data-table-shell='true'] .ant-spin-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        [data-table-shell='true'] .ant-table,
        [data-table-shell='true'] .ant-table-container,
        [data-table-shell='true'] .ant-table-content {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        [data-table-shell='true'] .ant-table-body {
          flex: 1;
          min-height: 0;
        }
        [data-table-shell='true'][data-empty='true'] .ant-table,
        [data-table-shell='true'][data-empty='true'] .ant-table-container,
        [data-table-shell='true'][data-empty='true'] .ant-table-content,
        [data-table-shell='true'][data-empty='true'] .ant-table-body {
          height: 100%;
        }
        [data-table-shell='true'][data-empty='true'] .ant-table-content > table,
        [data-table-shell='true'][data-empty='true'] .ant-table-body > table {
          height: 100%;
        }
        [data-table-shell='true'][data-empty='true'] .ant-table-content > table > tbody,
        [data-table-shell='true'][data-empty='true'] .ant-table-body > table > tbody {
          height: 100%;
        }
        [data-table-shell='true'][data-empty='true'] .ant-table-tbody {
          height: 100%;
        }
        [data-table-shell='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder {
          height: 100%;
        }
        [data-table-shell='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder > td {
          height: 100%;
          padding: 0 !important;
        }
        [data-table-shell='true'][data-empty='true'] .ant-table-tbody > tr.ant-table-placeholder .ant-empty {
          height: 100%;
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        [data-table-shell='true'] .ant-table-pagination.ant-pagination {
          margin-block-start: auto;
          margin-block-end: 8px;
        }
      `}</style>
    </div>
  );
}
