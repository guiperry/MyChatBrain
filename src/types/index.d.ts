// Type declarations for all missing modules

// next-auth
declare module 'next-auth' {
  export function getServerSession(req: any, res: any, options: any): Promise<any>;
}

declare module 'next-auth/jwt' {
  export function getToken(options: any): Promise<any>;
}

// jspdf
declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: any);
    text(text: string, x: number, y: number): this;
    output(): string;
  }
}

// markdown-it
declare module 'markdown-it' {
  export default class MarkdownIt {
    constructor(options?: any);
    render(text: string): string;
  }
}


// @radix-ui/react-popover
declare module '@radix-ui/react-popover' {
  export const Root: React.FC<any>;
  export const Trigger: React.FC<any>;
  export const Content: React.FC<any>;
  export const Anchor: React.FC<any>;
  export const Close: React.FC<any>;
  export const Arrow: React.FC<any>;
}

// langchain modules
declare module '@langchain/core/runnables' {
  export class RunnableSequence {
    static from(components: any[]): any;
  }
  export class Runnable {
    constructor(llm: any);
    pipe(fn: Function): any;
  }
}

declare module 'langchain/text_splitter' {
  export class RecursiveCharacterTextSplitter {
    constructor(options: { chunkSize: number, chunkOverlap: number });
    splitText(text: string): Promise<string[]>;
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

declare module '@langchain/core/callbacks/manager' {
  export class CallbackManager {
    constructor();
  }
}

// clsx
declare module 'clsx' {
  export default function clsx(...inputs: any[]): string;
}

// react-icons/ri
declare module 'react-icons/ri' {
  export const RiUser3Fill: React.ComponentType<any>;
}

// langfuse
declare module 'langfuse' {
  export class Langfuse {
    constructor(options: { publicKey: string, secretKey: string });
    trace(options: any): any;
  }
  export default class Run {
    constructor();
    shutdown(): void;
    span(options: any): any;
    update(options: any): void;
  }
}

// @vercel/blob
declare module '@vercel/blob' {
  export function put(path: string, data: any, options?: { access?: string; addRandomSuffix?: boolean; allowOverwrite?: boolean }): Promise<any>;
  export function list(options?: { prefix?: string; limit?: number }): Promise<{ blobs: Array<{ url: string; pathname: string; size: number }> }>;
  export function del(url: string): Promise<void>;
}

// @google/generative-ai
declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(options: { model: string }): any;
  }
  export enum HarmCategory {
    HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT'
  }

  export enum HarmBlockThreshold {
    BLOCK_NONE = 'BLOCK_NONE',
    BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
    BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
    BLOCK_HIGH_AND_ABOVE = 'BLOCK_HIGH_AND_ABOVE',
    BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH'
  }
}
