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
      const iframe = iframeRef.current;
      const document = iframe.contentDocument;
      if (document) {
        document.open();
        document.write('<!DOCTYPE html><html lang="en"><head></head><body></body></html>');
        document.close();

        const newDocument = iframe.contentDocument;
        if (newDocument) {
          newDocument.open();
          newDocument.write(`
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
                  ${code.css}
                </style>
              </head>
              <body>
                ${code.html}
                <script>
                  (function() {
                    ${code.js}
                  })();
                </script>
              </body>
            </html>
          `);
          newDocument.close();
        }
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
