import { Flex, Tabs, Typography } from 'antd';
import type { PageHeaderTabsProps } from './types';

export function PageHeaderTabs<T extends string>({
  items,
  value,
  onChange,
  right,
}: PageHeaderTabsProps<T>) {
  return (
    <Flex data-page-header-tabs="true" align="center" justify="space-between" gap={12}>
      <Tabs
        activeKey={value}
        onChange={(next) => onChange(next as T)}
        indicator={{ size: 0 }}
        style={{ flex: 1, marginBottom: 0 }}
        tabBarStyle={{ margin: 0, borderBottom: 'none' }}
        items={items.map((item) => ({
          key: item.id,
          label: (
            <Flex align="center" gap={3}>
              {item.icon ? <span style={{ display: 'inline-flex' }}>{item.icon}</span> : null}
              <span>{item.label}</span>
            </Flex>
          ),
        }))}
      />
      {right ? right : <Typography.Text type="secondary" />}
      <style>{`
        [data-page-header-tabs='true'] .ant-tabs-nav {
          margin: 0 !important;
        }
        [data-page-header-tabs='true'] .ant-tabs-nav::before {
          border-bottom: none !important;
        }
        [data-page-header-tabs='true'] .ant-tabs-nav-list {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px;
          border: 1px solid #e5e6eb;
          border-radius: 12px;
          background: #f5f7fa;
        }
        [data-page-header-tabs='true'] .ant-tabs-tab {
          margin: 0 !important;
          padding-block: 6px;
          padding-inline: 14px;
          border: none;
          border-radius: 12px;
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
        }
        [data-page-header-tabs='true'] .ant-tabs-tab .ant-tabs-tab-btn {
          display: inline-flex;
          align-items: center;
          color: #4e5969;
          font-size: 13px;
          line-height: 18px;
          transition: color 0.2s ease;
        }
        [data-page-header-tabs='true'] .ant-tabs-tab:hover {
          background: #eef1f5;
        }
        [data-page-header-tabs='true'] .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: #1d2129;
        }
        [data-page-header-tabs='true'] .ant-tabs-tab.ant-tabs-tab-active {
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(31, 35, 41, 0.08), inset 0 0 0 1px #d6e4ff;
        }
        [data-page-header-tabs='true'] .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #1664ff;
          font-weight: 600;
        }
      `}</style>
    </Flex>
  );
}
