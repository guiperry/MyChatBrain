// gemini.ts
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { Langfuse } from 'langfuse';
import { indexGitHubRepo, extractGitHubURL, runRAGChain } from "./utils";

const langfuse = new Langfuse({
    publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY || "pk-lf-public-key",
  secretKey: process.env.NEXT_PUBLIC_LANGFUSE_SECRET_KEY || "sk-lf-secret-key",
  });

const MODEL_NAME = process.env.NEXT_PUBLIC_MODEL_NAME || "gemini-pro";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const WEAVIATE_URL = process.env.NEXT_PUBLIC_WEAVIATE_URL || "";
const WEAVIATE_API_KEY = process.env.NEXT_PUBLIC_WEAVIATE_API_KEY || "";

interface ModelParams  {
     generationConfig: {
            temperature: number;
             topK: number;
          topP: number;
             maxOutputTokens: number;
          };
           history : any[] ,
    safetySettings : { category: HarmCategory;
    threshold: HarmBlockThreshold;
}[]

   }

async function runChat(prompt: string, history : any[] = []) :Promise <string> {
     const googleGenerativeAI = new GoogleGenerativeAI(API_KEY );
    const model  = await googleGenerativeAI.getGenerativeModel({ model: MODEL_NAME });

       const generationConfig  =  {
              temperature: 0.9,
               topK: 1,
              topP: 1,
             maxOutputTokens: 2048,
         };

   const safetySettings  = [
          {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
               threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
           },
           {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
           {
               category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
           {
             category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
         },
       ];
  const modelParams : ModelParams= {
      generationConfig : generationConfig,
    history: history,
       safetySettings : safetySettings
 };

   const chat = model.startChat({
          generationConfig: modelParams.generationConfig,
           history: modelParams.history,
             safetySettings: modelParams.safetySettings
       });
     const githubURL  = await extractGitHubURL(prompt);
     let responseText = "";
        if (githubURL) {
        console.log("Github URL detected");
      try {
            console.log("Indexing Repo");
              await indexGitHubRepo(githubURL[ 0 ], API_KEY [ 0 ], MODEL_NAME [ 0 ] , WEAVIATE_URL [ 0 ], WEAVIATE_API_KEY [ 0 ], "CodeFiles" [ 0 ]);
                  console.log("Running RAG Chain");
          const ragResponse :any =  await runRAGChain({ prompt, apiKey :API_KEY, modelName : MODEL_NAME, weaviateURL: WEAVIATE_URL, weaviateApiKey: WEAVIATE_API_KEY,  className: "CodeFiles"  });
               responseText =  ragResponse.prompt;

       }  catch (error : any) {
           console.error("Error processing github URL", error);
              const result :any = await chat.sendMessage(prompt);
               const response :any  = result.response;
                responseText = response.text();

        }
     } else {
            const result :any = await chat.sendMessage(prompt);
              const response: any = result.response;
            responseText = response.text();
          }
        console.log(responseText)
         return responseText
     }


 
   
   export default runChat;
