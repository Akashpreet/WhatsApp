/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns:[
            {hostname:"tacit-meerkat-627.convex.cloud"},
            {hostname:"https://oaidalleapiprodscus.blob.core.windows.net"}
        ]
    }
};

export default nextConfig;
