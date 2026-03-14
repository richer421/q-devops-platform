import React from 'react';

type CodeTagProps = {
  children: React.ReactNode;
  tone?: 'default' | 'purple';
};

const CodeTag: React.FC<CodeTagProps> = ({ children, tone = 'default' }) => {
  const styles =
    tone === 'purple'
      ? { background: '#F0ECFF', color: '#7B61FF' }
      : { background: '#F2F3F5', color: '#4E5969' };

  return (
    <code
      style={{
        ...styles,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 11,
      }}
    >
      {children}
    </code>
  );
};

export default CodeTag;
