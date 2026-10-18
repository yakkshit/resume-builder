declare module "@browsermt/bergamot-translator/translator.js" {
  export class TranslatorBacking {
    constructor(options?: any);
    options: any;
    onerror?: (err: Error) => void;
    loadWorker(): Promise<{ worker: Worker; exports: any }>;
  }
  export class BatchTranslator {
    constructor(options?: {
      pivotLanguage?: string;
      downloadTimeout?: number;
      batchSize?: number;
      workers?: number;
      workerUrl?: string;
      modelRegistryUrl?: string;
      onerror?: (err: Error) => void;
    }, backing?: TranslatorBacking);
    translate(request: {
      from: string;
      to: string;
      text: string;
      html?: boolean;
      priority?: number;
    }): Promise<{ target?: { text?: string } }>;
    delete(): Promise<void>;
  }
}
