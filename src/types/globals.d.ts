// Global type declarations for external libraries loaded via script tags

declare global {
  interface Window {
    Html2Jade: {
      convert: (html: string, options?: { tabs?: boolean; tabsize?: number }) => string;
    };
    pug: {
      compile: (source: string, options?: any) => (locals?: any) => string;
      render: (source: string, options?: any) => string;
    };
    process: {
      versions: { node: string };
      env: Record<string, string | undefined>;
    };
  }
}

export {};
