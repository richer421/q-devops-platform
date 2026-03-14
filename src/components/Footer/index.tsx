import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'transparent',
        paddingBlock: 12,
      }}
      copyright="Q Workplatform"
      links={[
        {
          key: 'studio',
          title: 'Q PaaS Studio',
          href: 'https://github.com/richer421/q-paas-studio',
          blankTarget: true,
        },
        {
          key: 'workplatform',
          title: 'q-workplatform',
          href: 'https://github.com/richer421/q-workplatform',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
