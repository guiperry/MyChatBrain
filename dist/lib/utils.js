import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import axios from "axios";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import Run, { Langfuse } from "langfuse";
import clsx from 'clsx';
import path from 'path';
import os from 'os';
const langfuse = new Langfuse({
    publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY || "pk-lf-public-key",
    secretKey: process.env.NEXT_PUBLIC_LANGFUSE_SECRET_KEY || "sk-lf-secret-key",
});
async function getEmbeddings({ apiKey, modelName, texts }) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const trace = new Run();
    let embeddings;
    try {
        embeddings = await model.embedContent({
            content: { role: "user", parts: texts.map((text) => ({ text })) },
        });
        console.log({ output: "Embedding success" });
    }
    catch (error) {
        console.log({ output: "Embedding error" });
        console.log({ output: `Exception: ${error.message}` });
        throw error;
    }
    finally {
        trace.shutdown();
    }
    return embeddings.embedding.values; // Directly return the values array
}
async function generateResponse({ prompt, apiKey, modelName, retriever = null, question = null }) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const trace = new Run();
    console.log({ input: { prompt, question } });
    let response;
    try {
        if (retriever) {
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
                    context: retriever.pipe((docs) => docs.map((doc) => doc.pageContent).join("\n")),
                    question: (input) => input.question,
                },
                promptTemplate,
                //new Runnable(llm),
                new StringOutputParser(),
            ]);
            response = await chain.invoke({
                question: question,
            }, {
                callbacks: [new CallbackManager()],
            });
            response = response;
        }
        else {
            const result = await model.generateContent(prompt);
            response = result.response.text();
        }
        console.log({ output: { response } });
    }
    catch (error) {
        console.log({ output: "Response error" });
        console.log({ output: "Response error" });
        throw error;
    }
    finally {
        trace.shutdown();
    }
    return response;
}
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
function twMerge(...classes) {
    return clsx(classes);
}
export function tw(...classes) {
    return clsx(classes);
}
async function listFiles(repoURL) {
    const apiURL = repoURL.replace("github.com", "api.github.com/repos") + "/git/trees/main?recursive=1";
    const trace = langfuse.trace({
        name: "listFiles",
        input: { repoURL }
    });
    const span_name = "ListFiles-Span";
    const span = trace.span({ name: span_name });
    let response;
    try {
        response = await axios.get(apiURL);
        if (response.status !== 200) {
            trace.update({ output: { message: `Failed to fetch file list: ${response.status}` } });
            throw new Error(`Failed to fetch file list: ${response.status}`);
        }
        const treeData = response.data.tree;
        const files = treeData.filter((item) => item.type === 'blob').map((item) => {
            return { path: item.path, url: item.url };
        });
        trace.update({ output: { files } });
        return files;
    }
    catch (error) {
        trace.update({ output: { message: 'Error listing files', level: "ERROR", exception: error } });
        throw error;
    }
    finally {
        span.end();
    }
}
async function getFileInfo(url) {
    const trace = langfuse.trace({
        name: "getFileInfo",
        input: { url }
    });
    const span_name = "GetFileInfo-Span";
    const span = trace.span({ name: span_name });
    let fileInfo = {};
    try {
        const response = await axios.get(url);
        if (response.status !== 200) {
            trace.update({ output: { message: `Failed to fetch file info: ${response.status}` } });
            throw new Error(`Failed to fetch file info: ${response.status}`);
        }
        fileInfo = response.data;
        trace.update({ output: { message: `Successfully fetched file info: ${fileInfo.download_url}` } });
        return fileInfo.download_url;
    }
    catch (error) {
        trace.update({ output: { message: "Error fetching file info", level: "ERROR", exception: error } });
        throw error;
    }
    finally {
        span.end();
    }
}
async function indexGitHubRepo(repoURL, apiKey, modelName, weaviateURL, weaviateApiKey, className) {
    const trace = langfuse.trace({
        name: "indexGitHubRepo",
        input: { repoURL, apiKey, modelName, weaviateURL, weaviateApiKey, className }
    });
    const span_name = "IndexGitHubRepo-Span";
    const span = trace.span({ name: span_name });
    try {
        const files = await listFiles(repoURL);
        trace.update({ output: { message: "Files have been indexed" } });
        return files;
    }
    catch (error) {
        trace.update({ output: { message: "Error indexing GitHub repo", level: "ERROR", exception: error } });
        throw error;
    }
    finally {
        span.end();
    }
}
async function fetchFileContent(downloadURL) {
    const trace = langfuse.trace({
        name: "fetchFileContent",
        input: { downloadURL }
    });
    const span_name = "FetchFileContent-Span";
    const span = trace.span({ name: span_name });
    let content = "";
    try {
        const response = await axios.get(downloadURL);
        if (response.status !== 200) {
            trace.update({ output: { message: `Failed to fetch content: ${response.status}` } });
            throw new Error(`Failed to fetch content: ${response.status}`);
        }
        content = response.data;
        trace.update({ output: { message: `Successfully fetched file content` } });
        return content;
    }
    catch (error) {
        trace.update({ output: { message: "Error fetching content", level: "ERROR", exception: error } });
        throw error;
    }
    finally {
        span.end();
    }
}
async function extractGitHubURL(text) {
    const githubRegex = /(https?:\/\/github\.com\/[\w-]+)\/?([\w-]+\/?)([\w-]+\/?)([\w-]+\/?)/;
    const match = text?.match(githubRegex);
    return match ? match[0] : null;
}
async function runRAGChain({ prompt, apiKey, modelName, weaviateURL, weaviateApiKey, className }) {
    const trace = langfuse.trace({
        name: "runRAGChain",
        input: { prompt, apiKey, modelName, weaviateURL, weaviateApiKey, className }
    });
    const span_name = "RunRAGChain-Span";
    const span = trace.span({ name: span_name });
    try {
        trace.update({ output: { message: `Successfully ran rag chain` } });
        return { prompt, apiKey, modelName, weaviateURL, weaviateApiKey, className };
    }
    catch (error) {
        trace.update({ output: { message: "Error running RAG chain", level: "ERROR", exception: error } });
        throw error;
    }
    finally {
        span.end();
    }
}
function getAppDataDir() {
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
export { runRAGChain, getEmbeddings, generateResponse, extractGitHubURL, indexGitHubRepo, fetchFileContent, getFileInfo, listFiles, getAppDataDir };
