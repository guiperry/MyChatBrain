import { Pinecone } from "@pinecone-database/pinecone";
const pinecone = new Pinecone({
    apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY || '',
});
interface PineconeIndex {
    Index: (indexName: string) => Promise<any>;
}

async function getPineconeIndex(indexName: string): Promise<any> {
    return (pinecone as unknown as PineconeIndex).Index(indexName);
}

export {
    getPineconeIndex,
}