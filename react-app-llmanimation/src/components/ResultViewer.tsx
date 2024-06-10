import React, { useEffect, useRef } from 'react';

interface ResultViewerProps {
  code: {
    html: string;
    css: string;
    js: string;
  };
}

const ResultViewer: React.FC<ResultViewerProps> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const document = iframeRef.current.contentDocument;
      if (document) {
        document.open();
        document.write(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  overflow: hidden;
                }
                // body > * {
                //   max-width: 100%;
                //   max-height: 100%;
                //   object-fit: contain;
                // }
                ${code.css}
              </style>
            </head>
            <body>
              ${code.html}
              <script>${code.js}</script>
            </body>
          </html>
        `);
        document.close();
      }
    }
  }, [code]);

  return (
    <div className="result-viewer">
      <iframe ref={iframeRef} title="Result Viewer" />
    </div>
  );
};

export default ResultViewer;
