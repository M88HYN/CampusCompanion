declare module 'better-sqlite3' {
  export interface Database {
    prepare(sql: string): any;
    exec(sql: string): void;
    pragma(pragma: string, options?: any): any;
    close(): void;
  }

  export interface Options {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message: string) => void;
  }

  function Database(filename: string, options?: Options): Database;

  export default Database;
}
