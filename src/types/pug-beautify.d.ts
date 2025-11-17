declare module 'pug-beautify' {
  interface PugBeautifyOptions {
    fill_tab?: boolean;
    tab_size?: number;
    omit_div?: boolean;
  }

  function pugBeautify(code: string, options?: PugBeautifyOptions): string;
  export = pugBeautify;
}
