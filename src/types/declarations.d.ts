// Module declarations for packages without proper type definitions

declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: any);
    text(text: string, x: number, y: number): this;
    output(): string;
    save(filename: string): void;
  }
}

declare module '@langchain/core/prompts' {
  export class ChatPromptTemplate {
    static fromMessages(messages: any[]): any;
  }
}

declare module '@langchain/core/output_parsers' {
  export class StringOutputParser {
    constructor();
  }
}

declare module '@langchain/core/runnables' {
  export class RunnableSequence {
    static from(components: any[]): any;
  }
  export class Runnable {
    constructor(llm?: any);
    pipe(fn: Function): any;
  }
}

declare module '@langchain/core/callbacks/manager' {
  export class CallbackManager {
    constructor();
  }
}
