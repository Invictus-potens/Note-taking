'use client';

import dynamic from 'next/dynamic';

// Dynamic import for ReactQuill
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div style={{ height: '40vh', border: '1px solid #ccc', padding: '10px' }}>Loading editor...</div>
});

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

const QuillEditor: React.FC<QuillEditorProps> = ({ value, onChange, placeholder, style }) => {
  return (
    <ReactQuill
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={style}
      modules={{
        toolbar: [
          [{ 'header': [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
          ['link', 'image'],
          ['clean']
        ],
      }}
    />
  );
};

export default QuillEditor; 