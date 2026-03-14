import { Space } from 'antd';
import React from 'react';

type FilterToolbarProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
};

const FilterToolbar: React.FC<FilterToolbarProps> = ({ left, right }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <Space size={12} wrap>
        {left}
      </Space>
      <Space size={8} wrap>
        {right}
      </Space>
    </div>
  );
};

export default FilterToolbar;
