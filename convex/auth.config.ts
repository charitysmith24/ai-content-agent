if (!process.env.CLERK_ISSUER_URL) {
  throw new Error("CLERK_ISSUER_URL is not defined");
}

const authConfig = {
  providers: [
    {
      domain: "https://fond-elephant-91.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
