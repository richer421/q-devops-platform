import { Space } from 'antd';
import React from 'react';

type AppPageProps = {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
};

const AppPage: React.FC<AppPageProps> = ({ title, subtitle, extra, children }) => {
  return (
    <div className="qw-page-grid">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: '#1D2129',
              fontSize: 20,
              fontWeight: 600,
              lineHeight: '28px',
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <div
              style={{
                marginTop: 4,
                color: '#86909C',
                fontSize: 13,
                lineHeight: '20px',
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {extra ? <Space size={8}>{extra}</Space> : null}
      </div>
      {children}
    </div>
  );
};

export default AppPage;
