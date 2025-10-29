import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence, Runnable } from "@langchain/core/runnables";
import axios from "axios";
import {CallbackManager} from "@langchain/core/callbacks/manager";

import Run, { Langfuse } from "langfuse";

import clsx from 'clsx';
import path from 'path';
import os from 'os';

const langfuse = new Langfuse({
    publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY || "pk-lf-public-key",
    secretKey: process.env.NEXT_PUBLIC_LANGFUSE_SECRET_KEY || "sk-lf-secret-key",
});

interface EmbeddingsProps {
    apiKey:string,
   modelName: string,
   texts: string[]
 }

async function getEmbeddings({ apiKey, modelName, texts }: EmbeddingsProps): Promise<number[]> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const trace = new Run();
    let embeddings;
    try {
        embeddings = await model.embedContent({
            content: { role: "user", parts: texts.map((text) => ({ text })) },
        });
        console.log({ output: "Embedding success" });
    } catch (error: any) {
        console.log({ output: "Embedding error" });
        console.log({ output: `Exception: ${error.message}` });
        throw error;
    } finally {
        trace.shutdown();
       
    }

    return embeddings.embedding.values; // Directly return the values array
}





interface generateResponseProps {
    prompt: string,
        apiKey: string,
       modelName : string,
        retriever?: any | null,
      question?: string | null

    }

async function generateResponse({prompt, apiKey, modelName, retriever = null, question = null}: generateResponseProps ) : Promise <string> {
      const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const trace = new Run();
        console.log({ input: { prompt, question } });
      let response;
    try{
       if(retriever){
           const llm = new GoogleGenerativeAI(apiKey);
           const model = llm.getGenerativeModel({ model: modelName });
           // Removed llm.streaming as it does not exist on GoogleGenerativeAI
          const promptTemplate = ChatPromptTemplate.fromMessages([
                  ["system", `Use the following pieces of context to answer the question at the end.
                    If you don't know the answer, just say that you don't know, don't try to make up an answer.
                  Context:
                      {context}`],
                   ["user", "{question}"],
         ]);
             const chain = RunnableSequence.from([
                {
                   context: retriever.pipe((docs :any )=> docs.map((doc:any) => doc.pageContent).join("\n") ),
                    question: (input :any) => input.question,
               },
              promptTemplate,
                //new Runnable(llm),
                 new StringOutputParser(),
            ]);
             response = await chain.invoke(
                 {
                      question: question,
               }, {
                   callbacks: [new CallbackManager()],
              }
               );
           response = response;

            }else{
             const result = await model.generateContent(prompt);
              response = result.response.text()
          }
     console.log({output : {response}});
   }  catch (error : any ) {
    console.log({ output: "Response error" })
    console.log({ output: "Response error" });
        throw error
    }  finally {
           trace.shutdown();
     }
       return response;
  }

interface CnProps {
    inputs: (string | undefined | null | false)[];
}

export function cn(...inputs: CnProps['inputs']): string {
    return twMerge(clsx(inputs));
}
function twMerge(...classes: string[]): string {
    return clsx(classes);
}

export function tw(...classes: string[]): string {
    return clsx(classes);
}

interface GitHubFile {
    path: string,
   url: string
}

async function listFiles(repoURL : string ): Promise<GitHubFile[] > {
    const apiURL = repoURL.replace("github.com", "api.github.com/repos") + "/git/trees/main?recursive=1";
 const trace = langfuse.trace({
    name: "listFiles",
      input: { repoURL}
    });
const span_name = "ListFiles-Span";
const span = trace.span({ name: span_name});
 let response;
 try{
   response = await axios.get(apiURL);
     if (response.status !== 200) {
       trace.update({output:{message: `Failed to fetch file list: ${response.status}`}});
          throw new Error(`Failed to fetch file list: ${response.status}`);
       }
        const treeData = response.data.tree;
           const files =  treeData.filter((item : {type :string} ) => item.type === 'blob').map((item : {path:string, url :string }) => {
            return { path: item.path, url: item.url }
        });
        trace.update({ output: {files}});
        return files;
  } catch (error) {
       trace.update({output:{message: 'Error listing files', level: "ERROR", exception: error}})
        throw error;
  } finally {
     span.end();
 }
}
interface fileInfo  {
  download_url: string
}

async function getFileInfo(url: string): Promise<string>  {
    const trace = langfuse.trace({
         name: "getFileInfo",
         input: { url }
      });
    const span_name = "GetFileInfo-Span";
    const span = trace.span({ name: span_name});

    let fileInfo:fileInfo = {} as fileInfo ;
    try {
        const response = await axios.get(url);
         if (response.status !== 200) {
                 trace.update({output:{message: `Failed to fetch file info: ${response.status}`}})
              throw new Error(`Failed to fetch file info: ${response.status}`);
         }
      fileInfo  =  response.data
        trace.update({output:{message:`Successfully fetched file info: ${fileInfo.download_url}`}})
        return fileInfo.download_url
        } catch (error : any) {

            trace.update({output:{message: "Error fetching file info", level:"ERROR", exception: error}})
         throw error;
        }
        finally {
           span.end()
        }
    }

interface fetchFile  {
    url: string
}



async function indexGitHubRepo(repoURL: string, apiKey: string, modelName: string, weaviateURL: string, weaviateApiKey: string, className: string) {
    const trace = langfuse.trace({
        name: "indexGitHubRepo",
        input: { repoURL, apiKey, modelName, weaviateURL, weaviateApiKey, className }
    });
    const span_name = "IndexGitHubRepo-Span";
    const span = trace.span({ name: span_name});
   
    try {
          const files = await listFiles(repoURL);

              trace.update({output:{message: "Files have been indexed"}});
            return files;
   } catch (error:any ) {
       trace.update({output:{message: "Error indexing GitHub repo", level:"ERROR", exception: error}})
          throw error;
    } finally {
        span.end()
     }
 }

 async function fetchFileContent(downloadURL :string)  {
    const trace = langfuse.trace({
       name: "fetchFileContent",
          input: {downloadURL}
       });
    const span_name = "FetchFileContent-Span";
    const span = trace.span({ name: span_name});
    let content: string = "";
      try {
           const response = await axios.get(downloadURL);
            if (response.status !== 200) {
                  trace.update({output:{message: `Failed to fetch content: ${response.status}`}})
                throw new Error(`Failed to fetch content: ${response.status}`);
           }
           content =  response.data;
      trace.update({output:{message: `Successfully fetched file content`}});
      return content;
  } catch (error: any ) {
     trace.update({output:{message: "Error fetching content", level:"ERROR", exception: error}})
      throw error;
 } finally {
      span.end();
   }
}
async function extractGitHubURL(text: string|undefined )  {
    const githubRegex = /(https?:\/\/github\.com\/[\w-]+)\/?([\w-]+\/?)([\w-]+\/?)([\w-]+\/?)/;
      const match = text?.match(githubRegex);
      return match ? match[0] : null;
}

interface RunRAGProps {
    prompt : string,
         apiKey :string,
        modelName :string,
       weaviateURL:string,
          weaviateApiKey :string,
         className:string
  }

async function runRAGChain({ prompt, apiKey, modelName, weaviateURL, weaviateApiKey, className } : RunRAGProps)  {
    const trace = langfuse.trace({
            name: "runRAGChain",
             input: { prompt, apiKey, modelName, weaviateURL, weaviateApiKey, className}
          });
    const span_name = "RunRAGChain-Span";
    const span = trace.span({ name: span_name});

        try{
          trace.update({output: {message: `Successfully ran rag chain`}});
         return  {prompt, apiKey, modelName, weaviateURL, weaviateApiKey, className}
        } catch (error:any ) {
           trace.update({output:{message: "Error running RAG chain", level: "ERROR", exception: error}});
            throw error
        } finally{
           span.end();
      }
 }

function getAppDataDir(): string {
  const appName = 'My Chat Brain v2';
  const platform = os.platform();

  switch (platform) {
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', appName);
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appName);
    case 'linux':
    default:
      return path.join(os.homedir(), '.local', 'share', appName.toLowerCase().replace(/\s+/g, '-'));
  }
}
 export {
    runRAGChain,
    getEmbeddings,
    generateResponse,
    extractGitHubURL,
    indexGitHubRepo,
    fetchFileContent,
     getFileInfo,
    listFiles,
    getAppDataDir
}
