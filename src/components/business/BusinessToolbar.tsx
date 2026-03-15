import { Flex, Input, Typography } from 'antd';
import { Search } from 'lucide-react';

type BusinessToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  count: number;
};

export function BusinessToolbar({ value, onChange, count }: BusinessToolbarProps) {
  return (
    <Flex align="center" gap={12}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索名称或描述"
        prefix={<Search size={14} />}
        style={{ width: 280 }}
      />
      <Typography.Text type="secondary">{count} 个业务单元</Typography.Text>
    </Flex>
  );
}
