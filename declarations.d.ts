declare module "@browsermt/bergamot-translator/translator.js" {
  export class BatchTranslator {
    constructor(options?: {
      pivotLanguage?: string;
      downloadTimeout?: number;
      batchSize?: number;
      workers?: number;
      workerUrl?: string;
      modelRegistryUrl?: string;
    });
    translate(request: {
      from: string;
      to: string;
      text: string;
      html?: boolean;
      priority?: number;
    }): Promise<{ target?: { text?: string } }>;
  }
}
